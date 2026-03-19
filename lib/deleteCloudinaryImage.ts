import cloudinary from "./cloudinary";

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
	if (!publicId.trim()) {
		return;
	}

	await cloudinary.uploader.destroy(publicId);
}
