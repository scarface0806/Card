import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

export type CloudinaryUploadResult = {
	url: string;
	publicId: string;
};

export async function uploadToCloudinary(
	buffer: Buffer,
	folder: string,
	publicId?: string
): Promise<CloudinaryUploadResult> {
	if (!buffer.length) {
		throw new Error("Upload buffer is empty");
	}

	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				resource_type: "image",
				folder,
				public_id: publicId,
			},
			(error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
				if (error || !result) {
					reject(error ?? new Error("Cloudinary upload failed"));
					return;
				}

				resolve({
					url: result.secure_url,
					publicId: result.public_id,
				});
			}
		);

		stream.end(buffer);
	});
}

export { cloudinary };
export default cloudinary;
