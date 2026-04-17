"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useImageUpload } from "../../hooks/useImageUpload";

type AspectRatio = "square" | "landscape" | "portrait";

type ImageUploadProps = {
	folder: string;
	onUploadComplete: (url: string, publicId: string) => void;
	currentImageUrl?: string;
	label?: string;
	aspectRatio?: AspectRatio;
};

const aspectRatioClass: Record<AspectRatio, string> = {
	square: "aspect-square",
	landscape: "aspect-video",
	portrait: "aspect-[3/4]",
};

export default function ImageUpload({
	folder,
	onUploadComplete,
	currentImageUrl,
	label = "Image",
	aspectRatio = "landscape",
}: ImageUploadProps) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
	const [isDragOver, setIsDragOver] = useState(false);

	const { imageUrl, publicId, isUploading, progress, error, handleFileSelect, reset } = useImageUpload(folder);

	useEffect(() => {
		setPreviewUrl(currentImageUrl || null);
	}, [currentImageUrl]);

	useEffect(() => {
		if (imageUrl && publicId) {
			setPreviewUrl(imageUrl);
			onUploadComplete(imageUrl, publicId);
		}
	}, [imageUrl, publicId, onUploadComplete]);

	const wrapperClass = useMemo(() => {
		if (isDragOver) {
			return "rounded-xl border border-dashed border-primary/30 bg-primary/100/10 p-4 transition-colors";
		}
		return "rounded-xl border border-dashed border-white/20 bg-[#0f1424] p-4 transition-colors hover:border-primary/40";
	}, [isDragOver]);

	const chooseFile = () => fileInputRef.current?.click();

	const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		setPreviewUrl(URL.createObjectURL(file));
		await handleFileSelect(file);
	};

	const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragOver(false);
		const file = event.dataTransfer.files?.[0];
		if (!file) {
			return;
		}

		setPreviewUrl(URL.createObjectURL(file));
		await handleFileSelect(file);
	};

	const onReset = () => {
		reset();
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="space-y-3">
			<p className="text-sm font-medium text-gray-200">{label}</p>

			<div
				className={wrapperClass}
				onDrop={onDrop}
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
			>
				{previewUrl ? (
					<div className="space-y-3">
						<div className={`overflow-hidden rounded-lg border border-white/10 bg-[#161b2e] ${aspectRatioClass[aspectRatio]}`}>
							<img src={previewUrl} alt="Uploaded preview" className="h-full w-full object-cover" />
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={chooseFile}
								disabled={isUploading}
								className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-60"
							>
								<ImagePlus className="h-3.5 w-3.5" />
								Replace
							</button>
							<button
								type="button"
								onClick={onReset}
								disabled={isUploading}
								className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
							>
								<Trash2 className="h-3.5 w-3.5" />
								Remove
							</button>
						</div>
					</div>
				) : (
					<button
						type="button"
						onClick={chooseFile}
						disabled={isUploading}
						className="flex w-full flex-col items-center justify-center gap-2 py-8 text-center text-sm text-gray-300 disabled:opacity-60"
					>
						<UploadCloud className="h-6 w-6 text-primary" />
						<span>Drag and drop an image here, or click to select</span>
						<span className="text-xs text-gray-500">JPG, PNG, WEBP, GIF up to 5MB</span>
					</button>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp,image/gif"
					onChange={onInputChange}
					className="hidden"
				/>
			</div>

			{isUploading ? (
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs text-gray-300">
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
						Uploading... {progress}%
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
						<div
							className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>
			) : null}

			{error ? <p className="text-sm text-red-400">{error}</p> : null}
		</div>
	);
}
