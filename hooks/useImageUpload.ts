"use client";

import { useState } from "react";

type UploadSuccessResponse = {
	success: true;
	url: string;
	publicId: string;
};

type UploadErrorResponse = {
	error?: string;
};

export type UseImageUploadResult = {
	imageUrl: string | null;
	publicId: string | null;
	isUploading: boolean;
	progress: number;
	error: string | null;
	handleFileSelect: (file: File) => Promise<void>;
	reset: () => void;
};

export function useImageUpload(folder: string): UseImageUploadResult {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [publicId, setPublicId] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setImageUrl(null);
		setPublicId(null);
		setIsUploading(false);
		setProgress(0);
		setError(null);
	};

	const handleFileSelect = async (file: File): Promise<void> => {
		setError(null);
		setIsUploading(true);
		setProgress(0);

		const formData = new FormData();
		formData.append("file", file);
		formData.append("folder", folder);

		try {
			const payload = await new Promise<UploadSuccessResponse>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
					if (event.lengthComputable) {
						setProgress(Math.round((event.loaded / event.total) * 100));
					}
				};

				xhr.onerror = () => {
					reject(new Error("Upload request failed"));
				};

				xhr.onreadystatechange = () => {
					if (xhr.readyState !== XMLHttpRequest.DONE) {
						return;
					}

					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							resolve(JSON.parse(xhr.responseText) as UploadSuccessResponse);
						} catch {
							reject(new Error("Invalid upload response"));
						}
						return;
					}

					try {
						const parsed = JSON.parse(xhr.responseText) as UploadErrorResponse;
						reject(new Error(parsed.error || "Upload failed"));
					} catch {
						reject(new Error("Upload failed"));
					}
				};

				xhr.open("POST", "/api/admin/upload");
				xhr.send(formData);
			});

			setImageUrl(payload.url);
			setPublicId(payload.publicId);
			setProgress(100);
		} catch (uploadError) {
			setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
			setImageUrl(null);
			setPublicId(null);
			setProgress(0);
		} finally {
			setIsUploading(false);
		}
	};

	return {
		imageUrl,
		publicId,
		isUploading,
		progress,
		error,
		handleFileSelect,
		reset,
	};
}
