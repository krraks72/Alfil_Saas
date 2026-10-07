<?php

namespace App\Http\Controllers;

use App\Models\MediaItem;
use App\Models\User;
use App\Services\StorageConfigService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user->can('manage-media') && !$user->can('manage-any-media') && !$user->can('manage-own-media')
            && $user->type !== 'superadmin' && $user->type !== 'company') {
            return response()->json(['message' => __('Permission Denied.')], 403);
        }

        $query = Media::query();

        if ($user->type === 'superadmin') {
            // Superadmin sees all media
        } elseif ($user->type === 'company') {
            // Company sees own + all users created by this company
            $companyUserIds = User::where('created_by', $user->id)->pluck('id')->toArray();
            $companyUserIds[] = $user->id;
            $query->whereIn('user_id', array_unique($companyUserIds));
        } elseif ($user->can('manage-any-media')) {
            // See company's media + own created_by users' media
            $query->whereIn('user_id', getCompanyAndUsersId());
        } elseif ($user->can('manage-own-media')) {
            // Only own uploaded media
            $query->where('user_id', $user->id);
        } else {
            $query->whereRaw('1 = 0');
        }

        $media = $query->latest()->get()->map(function ($media) {
            try {
                $originalUrl = $this->getFullUrl($media->getUrl());
                $thumbUrl = $originalUrl;

                try {
                    $thumbUrl = $this->getFullUrl($media->getUrl('thumb'));
                } catch (\Exception $e) {
                    // If thumb conversion fails, use original
                }

                return [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'url' => $originalUrl,
                    'thumb_url' => $thumbUrl,
                    'size' => $media->size,
                    'mime_type' => $media->mime_type,
                    'user_id' => $media->user_id,
                    'created_at' => $media->created_at,
                ];
            } catch (\Exception $e) {
                return null;
            }
        })->filter()->values();

        return response()->json($media);
    }

    private function getFullUrl($url)
    {
        if (str_starts_with($url, 'http')) {
            return $url;
        }
        
        $baseUrl = request()->getSchemeAndHttpHost();
        return $baseUrl . $url;
    }
    
    private function getRelativePath($url)
    {
        // If it's already a relative path, return as is
        if (!str_starts_with($url, 'http')) {
            return $url;
        }
        
        // Extract relative path from full URL
        $parsedUrl = parse_url($url);
        $path = $parsedUrl['path'] ?? $url;
        
        // Always return just the storage path without any app prefix
        if (preg_match('/\/storage\/(.+)$/', $path, $matches)) {
            return '/storage/' . $matches[1];
        }
        
        return $path;
    }

    private function getUserFriendlyError(\Exception $e, $fileName): string
    {
        $message = $e->getMessage();
        $extension = strtoupper(pathinfo($fileName, PATHINFO_EXTENSION));
        
        // Handle media library collection errors
        if (str_contains($message, 'was not accepted into the collection')) {
            if (str_contains($message, 'mime:')) {
                return __("File type not allowed : :extension", ['extension' => $extension]);
            }
            return __("File format not supported : :extension", ['extension' => $extension]);
        }
        
        // Handle storage errors
        if (str_contains($message, 'storage') || str_contains($message, 'disk')) {
            return __("Storage error : :extension", ['extension' => $extension]);
        }
        
        // Handle file size errors
        if (str_contains($message, 'size') || str_contains($message, 'large')) {
            return __("File too large : :extension", ['extension' => $extension]);
        }
        
        // Handle permission errors
        if (str_contains($message, 'permission') || str_contains($message, 'denied')) {
            return __("Permission denied : :extension", ['extension' => $extension]);
        }
        
        // Generic fallback
        return __("Upload failed : :extension", ['extension' => $extension]);
    }

    public function batchStore(Request $request)
    {
        if (!Auth::user()->can('create-media')) {
            return response()->json(['message' => __('Permission Denied.')], 403);
        }

        $storageCheck = $this->checkStorageLimit($request->file('files'));
        if ($storageCheck) {
            return $storageCheck;
        }

        $config = StorageConfigService::getStorageConfig();
        $allowedTypes = explode(',', $config['allowed_file_types'] ?? 'jpg,png,webp,gif');
        $maxSize = ($config['max_file_size_mb'] ?? 2) * 1024 * 1024;

        $errors = [];
        foreach ($request->file('files') as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $fileSize = $file->getSize();

            if (!in_array($extension, array_map('trim', $allowedTypes))) {
                $errors[] = __('File type not allowed: :name (:ext). Allowed types: :types', [
                    'name' => $file->getClientOriginalName(),
                    'ext' => strtoupper($extension),
                    'types' => strtoupper(implode(', ', $allowedTypes))
                ]);
            }

            if ($fileSize > $maxSize) {
                $errors[] = __('File too large: :name (:size). Max size: :max MB', [
                    'name' => $file->getClientOriginalName(),
                    'size' => round($fileSize / 1024 / 1024, 2) . 'MB',
                    'max' => $config['max_file_size_mb']
                ]);
            }
        }

        if (!empty($errors)) {
            return response()->json([
                'message' => __('File validation failed'),
                'errors' => $errors
            ], 422);
        }

        $uploadedMedia = [];
        $errors = [];

        foreach ($request->file('files') as $file) {
            try {
                $mediaItem = MediaItem::create([
                    'name' => $file->getClientOriginalName(),
                ]);

                $media = $mediaItem->addMedia($file)
                    ->toMediaCollection('images');

                $media->user_id = auth()->id();
                $media->save();

                $this->updateStorageUsage(auth()->user(), $media->size);

                try {
                    $media->getUrl('thumb');
                } catch (\Exception $e) {
                    // Thumbnail generation failed, but continue
                }

                $originalUrl = $this->getFullUrl($media->getUrl());
                $thumbUrl = $originalUrl;

                try {
                    $thumbUrl = $this->getFullUrl($media->getUrl('thumb'));
                } catch (\Exception $e) {
                    // If thumb conversion fails, use original
                }

                $uploadedMedia[] = [
                    'id' => $media->id,
                    'name' => $media->name,
                    'file_name' => $media->file_name,
                    'url' => $originalUrl,
                    'thumb_url' => $thumbUrl,
                    'size' => $media->size,
                    'mime_type' => $media->mime_type,
                    'user_id' => $media->user_id,
                    'created_at' => $media->created_at,
                ];
            } catch (\Exception $e) {
                if (isset($mediaItem)) {
                    $mediaItem->delete();
                }
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $this->getUserFriendlyError($e, $file->getClientOriginalName())
                ];
            }
        }

        if (count($uploadedMedia) > 0 && empty($errors)) {
            return response()->json([
                'message' => count($uploadedMedia) . __(' file(s) uploaded successfully'),
                'data' => $uploadedMedia
            ]);
        } elseif (count($uploadedMedia) > 0 && !empty($errors)) {
            return response()->json([
                'message' => count($uploadedMedia) . ' uploaded, ' . count($errors) . ' failed',
                'data' => $uploadedMedia,
                'errors' => array_column($errors, 'error')
            ]);
        } else {
            return response()->json([
                'message' => 'Upload failed',
                'errors' => array_column($errors, 'error')
            ], 422);
        }
    }

    public function download($id)
    {
        if (!Auth::user()->can('view-media')) {
            return response()->json(['message' => __('Permission Denied.')], 403);
        }

        $query = Media::where('id', $id);
        
        if (Auth::user()->type !== 'superadmin') {
            $query->whereIn('user_id', getCompanyAndUsersId());
        }
        
        $media = $query->firstOrFail();

        try {
            $filePath = $media->getPath();

            if (!file_exists($filePath)) {
                abort(404, __('File not found'));
            }

            return response()->download($filePath, $media->file_name);
        } catch (\Exception $e) {
            abort(404, __('File storage unavailable'));
        }
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('delete-media')) {
            return response()->json(['message' => __('Permission Denied.')], 403);
        }

        $query = Media::where('id', $id);
        
        if (Auth::user()->type !== 'superadmin') {
            $query->whereIn('user_id', getCompanyAndUsersId());
        }
        
        $media = $query->firstOrFail();
        $mediaItem = $media->model;
        $fileSize = $media->size;

        try {
            $media->delete();
        } catch (\Exception $e) {
            $media->forceDelete();
        }

        $this->updateStorageUsage(auth()->user(), -$fileSize);

        if ($mediaItem && $mediaItem->getMedia()->count() === 0) {
            $mediaItem->delete();
        }

        return response()->json(['message' => __('Media deleted successfully')]);
    }
    
    private function checkStorageLimit($files)
    {
        $user = auth()->user();
        if ($user->type === 'superadmin') return null;
        
        $limit = $this->getUserStorageLimit($user);
        if (!$limit) return null;
        
        $uploadSize = collect($files)->sum(fn($file) => $file->getSize());
        $currentUsage = $this->getUserStorageUsage($user);
        
        if (($currentUsage + $uploadSize) > $limit) {
            return response()->json([
                'message' => __('Storage limit exceeded'),
                'errors' => [__('Please delete files or upgrade plan')]
            ], 422);
        }
        
        return null;
    }
    
    private function getUserStorageLimit($user)
    {
        if ($user->type === 'company' && $user->plan) {
            return $user->plan->storage_limit * 1024 * 1024 * 1024;
        }

        $companyId = getCompanyIdByUser($user->id);
        if ($companyId) {
            $company = User::find($companyId);
            if ($company && $company->plan) {
                return $company->plan->storage_limit * 1024 * 1024 * 1024;
            }
        }

        return null;
    }
    
    private function getUserStorageUsage($user)
    {
        $companyId = $user->type === 'company' ? $user->id : getCompanyIdByUser($user->id);

        if ($companyId) {
            return User::where('id', $companyId)->value('storage_limit') ?? 0;
        }

        return $user->storage_limit ?? 0;
    }
    
    private function updateStorageUsage($user, $size)
    {
        $companyId = getCompanyIdByUser($user->id);
        $target = $companyId ? User::find($companyId) : $user;
        if ($target) {
            $target->increment('storage_limit', $size);
        }
    }
}