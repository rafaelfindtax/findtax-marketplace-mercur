import { AbstractFileProviderService, MedusaError } from '@medusajs/framework/utils';
import { Logger } from '@medusajs/framework/types';
import { 
  ProviderUploadFileDTO,
  ProviderDeleteFileDTO,
  ProviderFileResultDTO,
  ProviderGetFileDTO
} from '@medusajs/framework/types';
import { Client } from 'minio';
import path from 'path';
import { ulid } from 'ulid';

type InjectedDependencies = {
  logger: Logger
}

interface MinioServiceConfig {
  endPoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
  bucket?: string
  publicUrl?: string
}

export interface MinioFileProviderOptions {
  endPoint: string
  /** Optional port override. If `endPoint` contains ":<port>", it is parsed automatically. Defaults to 443 when useSSL=true, 80 otherwise. */
  port?: number
  /** Whether to use HTTPS. Defaults to true (S3-compatible cloud). Set to false for local MinIO over HTTP. */
  useSSL?: boolean
  accessKey: string
  secretKey: string
  bucket?: string
  /** Optional public-facing base URL used to build object URLs (e.g. http://localhost:9100). Falls back to `${proto}://${endPoint}`. */
  publicUrl?: string
}

const DEFAULT_BUCKET = 'medusa-media'

/**
 * Service to handle file storage using MinIO.
 */
class MinioFileProviderService extends AbstractFileProviderService {
  static identifier = 'minio-file'
  protected readonly config_: MinioServiceConfig
  protected readonly logger_: Logger
  protected client: Client
  protected readonly bucket: string

  constructor({ logger }: InjectedDependencies, options: MinioFileProviderOptions) {
    super()
    this.logger_ = logger

    // Parse "host:port" format if provided in endPoint (e.g. "minio:9000")
    let host = options.endPoint
    let parsedPort: number | undefined
    if (host && host.includes(':')) {
      const [h, p] = host.split(':')
      host = h
      parsedPort = parseInt(p, 10)
    }

    const useSSL = options.useSSL ?? true
    const port = options.port ?? parsedPort ?? (useSSL ? 443 : 80)

    this.config_ = {
      endPoint: host,
      port,
      useSSL,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      bucket: options.bucket,
      publicUrl: options.publicUrl
    }

    // Use provided bucket or default
    this.bucket = this.config_.bucket || DEFAULT_BUCKET
    this.logger_.info(`MinIO service initialized with bucket: ${this.bucket} (endpoint: ${useSSL ? 'https' : 'http'}://${host}:${port})`)

    // Initialize Minio client
    this.client = new Client({
      endPoint: this.config_.endPoint,
      port: this.config_.port,
      useSSL: this.config_.useSSL,
      accessKey: this.config_.accessKey,
      secretKey: this.config_.secretKey
    })

    // Initialize bucket and policy
    this.initializeBucket().catch(error => {
      this.logger_.error(`Failed to initialize MinIO bucket: ${error.message}`)
    })
  }

  static validateOptions(options: Record<string, any>) {
    const requiredFields = [
      'endPoint',
      'accessKey',
      'secretKey'
    ]

    requiredFields.forEach((field) => {
      if (!options[field]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `${field} is required in the provider's options`
        )
      }
    })
  }

  private async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const bucketExists = await this.client.bucketExists(this.bucket)
      
      if (!bucketExists) {
        // Create the bucket
        await this.client.makeBucket(this.bucket)
        this.logger_.info(`Created bucket: ${this.bucket}`)

        // Set bucket policy to allow public read access
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`]
            }
          ]
        }

        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
        this.logger_.info(`Set public read policy for bucket: ${this.bucket}`)
      } else {
        this.logger_.info(`Using existing bucket: ${this.bucket}`)
        
        // Verify/update policy on existing bucket
        try {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicRead',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`]
              }
            ]
          }
          await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
          this.logger_.info(`Updated public read policy for existing bucket: ${this.bucket}`)
        } catch (policyError) {
          this.logger_.warn(`Failed to update policy for existing bucket: ${policyError.message}`)
        }
      }
    } catch (error) {
      this.logger_.error(`Error initializing bucket: ${error.message}`)
      throw error
    }
  }

  async upload(
    file: ProviderUploadFileDTO
  ): Promise<ProviderFileResultDTO> {
    if (!file) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No file provided'
      )
    }

    if (!file.filename) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No filename provided'
      )
    }

    try {
      const parsedFilename = path.parse(file.filename)
      const fileKey = `${parsedFilename.name}-${ulid()}${parsedFilename.ext}`
      const content = Buffer.from(file.content, 'binary')

      // Upload file with public-read access
      await this.client.putObject(
        this.bucket,
        fileKey,
        content,
        content.length,
        {
          'Content-Type': file.mimeType,
          'x-amz-meta-original-filename': file.filename,
          'x-amz-acl': 'public-read'
        }
      )

      // Generate URL using the public-facing base URL (or fallback to endpoint)
      const baseUrl = this.config_.publicUrl
        ?? `${this.config_.useSSL ? 'https' : 'http'}://${this.config_.endPoint}${
          (this.config_.useSSL && this.config_.port === 443) || (!this.config_.useSSL && this.config_.port === 80)
            ? ''
            : `:${this.config_.port}`
        }`
      const url = `${baseUrl.replace(/\/$/, '')}/${this.bucket}/${fileKey}`

      this.logger_.info(`Successfully uploaded file ${fileKey} to MinIO bucket ${this.bucket}`)

      return {
        url,
        key: fileKey
      }
    } catch (error) {
      this.logger_.error(`Failed to upload file: ${error.message}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to upload file: ${error.message}`
      )
    }
  }

  async delete(
    fileData: ProviderDeleteFileDTO
  ): Promise<void> {
    if (!fileData?.fileKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No file key provided'
      )
    }

    try {
      await this.client.removeObject(this.bucket, fileData.fileKey)
      this.logger_.info(`Successfully deleted file ${fileData.fileKey} from MinIO bucket ${this.bucket}`)
    } catch (error) {
      // Log error but don't throw if file doesn't exist
      this.logger_.warn(`Failed to delete file ${fileData.fileKey}: ${error.message}`)
    }
  }

  async getPresignedDownloadUrl(
    fileData: ProviderGetFileDTO
  ): Promise<string> {
    if (!fileData?.fileKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'No file key provided'
      )
    }

    try {
      const url = await this.client.presignedGetObject(
        this.bucket,
        fileData.fileKey,
        24 * 60 * 60 // URL expires in 24 hours
      )
      this.logger_.info(`Generated presigned URL for file ${fileData.fileKey}`)
      return url
    } catch (error) {
      this.logger_.error(`Failed to generate presigned URL: ${error.message}`)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to generate presigned URL: ${error.message}`
      )
    }
  }
}

export default MinioFileProviderService
