export interface UploadedAsset {
  url: string
  name: string
  size: number
  type: string
}

export async function uploadImage(file: File): Promise<UploadedAsset> {
  return {
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    type: file.type,
  }
}
