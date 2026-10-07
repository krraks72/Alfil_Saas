import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { Upload, Search, X, Plus, Info, Copy, Download, MoreHorizontal, Image as ImageIcon, Calendar, HardDrive, BarChart3, FileText, File, Eye } from 'lucide-react';
import { getImageUrl } from '@/utils/imageHelpers';
import { hasPermission } from '@/utils/authorization';
import { Pagination } from '@/components/ui/pagination';

interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  url: string;
  thumb_url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export default function MediaLibrary() {
  const { t } = useTranslation();
  const { csrf_token, auth, storageSettings } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isChatGptOpen, setIsChatGptOpen] = useState(false);
  useEffect(() => {
    const checkChatGpt = () => {
      const chatGptModal = document.querySelector('[data-chatgpt-modal]');
      setIsChatGptOpen(!!chatGptModal);
    };
    const observer = new MutationObserver(checkChatGpt);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  const itemsPerPage = 12;

  // Permission checks
  const canCreate = hasPermission(permissions, 'create-media');
  const canView = hasPermission(permissions, 'view-media');
  const canDelete = hasPermission(permissions, 'delete-media');
  const canDownload = hasPermission(permissions, 'download-media');

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(route('api.media.index'), {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMedia(data);
      setFilteredMedia(data);
    } catch (error) {

      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);



  useEffect(() => {
    const filtered = media.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedia(filtered);
    setCurrentPage(1);
  }, [searchTerm, media]);



  const handleFileUpload = async (files: FileList) => {
    setUploading(true);

    const allowedExtensions = (storageSettings?.allowed_file_types ?? 'jpg,png,webp,gif')
      .split(',')
      .map((ext: string) => ext.trim().toLowerCase());
    const maxSizeMB = storageSettings?.max_file_size_mb ?? 2;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validFiles = Array.from(files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!allowedExtensions.includes(ext)) {
        toast.error(`${file.name}: type not allowed. Allowed: ${allowedExtensions.join(', ').toUpperCase()}`);
        return false;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name}: exceeds max size of ${maxSizeMB} MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }
    
    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files[]', file);
    });
    
    try {
      const response = await fetch(route('api.media.batch'), {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': csrf_token,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMedia(prev => [...result.data, ...prev]);
        toast.success(result.message);
        
        // Show individual errors if any
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => {
            toast.error(error);
          });
        }
      } else {
        // Handle demo mode and other errors
        if (response.status === 403) {
          toast.error(result.error);
        } else if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(result.message || 'Failed to upload files');
        }
      }
    } catch (error) {
      toast.error('Error uploading files');
    }
    
    setUploading(false);
    setIsUploadModalOpen(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const deleteMedia = async (id: number) => {
    try {
      const response = await fetch(route('api.media.destroy', id), {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': csrf_token,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMedia(prev => prev.filter(item => item.id !== id));
        toast.success(result.message || 'Media deleted successfully');
      } else {
        // Handle demo mode and other errors
        if (response.status === 403) {
          toast.error(result.message || result.error || 'Permission denied');
        } else if (response.status === 422) {
          toast.error(result.message || result.error || 'Action not allowed');
        } else {
          toast.error(result.message || result.error || 'Failed to delete media');
        }
      }
    } catch (error) {

      toast.error('Error deleting media');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(getImageUrl(url));
    toast.success('Image URL copied to clipboard');
  };

  const handleDownload = (id: number, filename: string) => {
    const link = document.createElement('a');
    link.href = route('api.media.download', id);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleShowInfo = (item: MediaItem) => {
    setSelectedMediaInfo(item);
    setInfoModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return window.appSettings.formatDateTime(new Date(dateString),false);
  };

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

  const paginationLinks = Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    return {
      url: pageNum.toString(),
      label: pageNum.toString(),
      active: currentPage === pageNum,
    };
  });

  const paginationLinksWithPrevNext = totalPages > 1 ? [
    {
      url: currentPage > 1 ? (currentPage - 1).toString() : null,
      label: '&laquo; ' + t('Previous'),
      active: false,
    },
    ...paginationLinks,
    {
      url: currentPage < totalPages ? (currentPage + 1).toString() : null,
      label: t('Next') + ' &raquo;',
      active: false,
    },
  ] : [];

  const breadcrumbs = [
    { title: t('Dashboard'), href: '/dashboard' },
    { title: t('Media Library') }
  ];

  const pageActions = canCreate ? [
    {
      label: t('Upload Media'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => setIsUploadModalOpen(true)
    }
  ] : [];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return null;
    if (mimeType.includes('pdf')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
          <FileText className="h-8 w-8 text-red-600" />
        </div>
        <span className="text-xs font-medium text-red-600">PDF</span>
      </div>
    );
    if (mimeType.includes('word') || mimeType.includes('document')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <span className="text-xs font-medium text-blue-600">DOC</span>
      </div>
    );
    if (mimeType.includes('csv') || mimeType.includes('spreadsheet')) return <FileText className="h-12 w-12 text-green-500" />;
    if (mimeType.startsWith('video/')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
          <File className="h-8 w-8 text-purple-600" />
        </div>
        <span className="text-xs font-medium text-purple-600">VID</span>
      </div>
    );
    if (mimeType.startsWith('audio/')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
          <File className="h-8 w-8 text-orange-600" />
        </div>
        <span className="text-xs font-medium text-orange-600">AUD</span>
      </div>
    );
    return <File className="h-12 w-12 text-gray-500" />;
  };

  return (
    <PageTemplate 
      title={t('Media Library')} 
      url="/media-library"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      description={t('Manage all your media files in one place.')}
    >
      <div className="space-y-6">

        {/* Search and Stats Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Section */}
              <div className="flex-1">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('Search media files...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('Showing results for "{{term}}"', { term: searchTerm })}
                  </p>
                )}
              </div>
              
              {/* Stats Section */}
              <div className="flex gap-6 items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{filteredMedia.length} {t('Files')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/10 rounded-md">
                    <HardDrive className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold">
                    {formatFileSize(filteredMedia.reduce((acc, item) => acc + item.size, 0))}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-md">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold">
                    {filteredMedia.filter(item => item.mime_type.startsWith('image/')).length} {t('Images')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        <Card>
          <CardContent className="p-3 lg:p-6 gap-3 lg:gap-6 flex flex-col h-full overflow-hidden bg-[#F0F0F1] dark:bg-gray-800">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('Loading media...')}</p>
              </div>
            ) : currentMedia.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('No media files found')}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? t('No results found for "{{term}}"', { term: searchTerm }) : t('Get started by uploading your first media file')}
                </p>
                {!searchTerm && hasPermission(permissions, 'create-media') && (
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)}
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Upload Media')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {currentMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleShowInfo(item)}
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square bg-muted">
                        {item.mime_type.startsWith('image/') ? (
                        <img
                          src={getImageUrl(item.thumb_url)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = getImageUrl(item.url);

                          }}
                        />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <div className="mb-2">
                              {getFileIcon(item.mime_type)}
                            </div>
                            <div className="text-xs text-center font-medium text-muted-foreground truncate w-full">
                              {item.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </div>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium text-foreground">
                              {t('Click to view')}
                            </div>
                          </div>
                        </div>

                        {/* File Type Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-background/95 text-foreground ring-border">
                            {item.mime_type.split('/')[1].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-3 space-y-2">
                        <div>
                          <h3 className="text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {window.appSettings.formatDateTime(new Date(item.created_at),false)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                  <Pagination
                    from={filteredMedia.length === 0 ? 0 : startIndex + 1}
                    to={Math.min(startIndex + itemsPerPage, filteredMedia.length)}
                    total={filteredMedia.length}
                    links={paginationLinksWithPrevNext}
                    hidePerPage={true}
                    onPageChange={(urlStr) => {
                      const pageNum = parseInt(urlStr, 10);
                      if (!isNaN(pageNum)) {
                        setCurrentPage(pageNum);
                      }
                    }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upload Modal */}
        {hasPermission(permissions, 'create-media') && (
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} modal={!isChatGptOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg p-0 rounded-lg overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Upload className="h-5 w-5 shrink-0 text-primary" />
                <span>{t('Upload Media Files')}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-4">
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className={`transition-all duration-200 ${
                  dragActive ? 'scale-110' : ''
                }`}>
                  <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Upload className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                      dragActive ? 'text-blue-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">
                    {dragActive ? t('Drop files here') : t('Upload your images')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                    {t('Drag and drop your images here, or click to browse')}
                  </p>
                  
                  <Input
                    type="file"
                    multiple
                    accept={(storageSettings?.allowed_file_types ?? 'jpg,png,webp,gif')
                      .split(',')
                      .map((ext: string) => `.${ext.trim()}`)
                      .join(',')}
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload-modal"
                  />
                  
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload-modal')?.click()}
                    disabled={uploading}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('Uploading...')}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        {t('Choose Files')}
                      </>
                    )}
                  </Button>
                </div>
                
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-500/10 rounded-xl" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        )}

        {/* Info Modal */}
        <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen} modal={!isChatGptOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl max-h-[90vh] sm:h-[85vh] p-0 rounded-lg overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="h-5 w-5 shrink-0 text-primary" />
                <span>{t('Media Details')}</span>
              </DialogTitle>
            </DialogHeader>

            {selectedMediaInfo && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side - Large Media Preview (75%) */}
                <div className="lg:col-span-3 min-w-0">
                  <div className="flex justify-center items-center bg-[#F0F0F1] dark:bg-gray-800 rounded-lg p-4 border border-border min-h-[260px] sm:min-h-[350px] lg:h-full">
                    {selectedMediaInfo.mime_type.startsWith('image/') ? (
                      <img
                        src={getImageUrl(selectedMediaInfo.url)}
                        alt={selectedMediaInfo.name}
                        className="max-w-full max-h-[50vh] lg:max-h-full w-auto h-auto object-contain rounded-md shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = getImageUrl(selectedMediaInfo.thumb_url);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full py-8">
                        <div className="mb-4 text-7xl sm:text-9xl">
                          {getFileIcon(selectedMediaInfo.mime_type)}
                        </div>
                        <div className="text-xl sm:text-3xl font-semibold text-muted-foreground mb-2 sm:mb-3">
                          {selectedMediaInfo.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </div>
                        <div className="text-xs sm:text-base text-muted-foreground max-w-md text-center break-all px-4">
                          {selectedMediaInfo.file_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Details & Actions (25%) */}
                <div className="lg:col-span-1 space-y-4 min-w-0">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">{t('File Information')}</h3>
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Name')}</span>
                        <p className="text-sm font-medium text-foreground break-all leading-tight">{selectedMediaInfo.file_name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Display Name')}</span>
                        <p className="text-sm font-medium text-foreground break-all leading-tight">{selectedMediaInfo.name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Type')}</span>
                        <div>
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium font-mono ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 break-all">{selectedMediaInfo.mime_type}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Size')}</span>
                        <p className="text-sm font-semibold text-foreground">{formatFileSize(selectedMediaInfo.size)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Uploaded')}</span>
                        <p className="text-sm font-medium text-foreground">{formatDate(selectedMediaInfo.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* URL Section */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File URL')}</span>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                      <code className="text-xs text-muted-foreground flex-1 break-all font-mono leading-tight">
                        {getImageUrl(selectedMediaInfo.url)}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyLink(selectedMediaInfo.url)} className="h-7 w-7 p-0 flex-shrink-0" title={t('Copy URL')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    {canView && (
                      <Button variant="outline" onClick={() => window.open(getImageUrl(selectedMediaInfo.url), '_blank')} className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2 shrink-0" />
                        {t('View')}
                      </Button>
                    )}
                    {canDownload && (
                      <Button variant="outline" onClick={() => handleDownload(selectedMediaInfo.id, selectedMediaInfo.file_name)} className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2 shrink-0" />
                        {t('Download')}
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4 mr-2 shrink-0" />
                        {t('Delete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <CrudDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => { if (selectedMediaInfo) { deleteMedia(selectedMediaInfo.id); setInfoModalOpen(false); setIsDeleteModalOpen(false); } }}
          itemName={selectedMediaInfo?.name || ''}
          entityName="Media"
        />
      </div>
    </PageTemplate>
  );
}