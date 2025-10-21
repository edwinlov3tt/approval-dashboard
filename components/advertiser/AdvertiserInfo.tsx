import React, { useState } from 'react';
import { Copy, Edit2, Save, X } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import { Button } from '@/components/UI/Button';

interface AdvertiserInfoProps {
  advertiser: {
    id: number;
    page_id: string;
    username: string;
    ad_account_id?: string;
    instagram_actor_id?: string;
    page_data: {
      name: string;
      profile_picture?: string;
      cover_image?: string;
      category?: string;
      instagram_url?: string;
      website?: string;
      instagram_details?: {
        result?: {
          username?: string;
        };
      };
    };
  };
  companyOverview?: string;
  website?: string;
}

export const AdvertiserInfo: React.FC<AdvertiserInfoProps> = ({ advertiser, companyOverview, website }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    website: website || advertiser.page_data.website || '',
    companyOverview: companyOverview || '',
    ad_account_id: advertiser.ad_account_id || '',
    instagram_actor_id: advertiser.instagram_actor_id || ''
  });

  const { page_data, page_id, username } = advertiser;

  // Build Instagram URL
  const instagramUrl = page_data.instagram_url ||
    (page_data.instagram_details?.result?.username
      ? `https://www.instagram.com/${page_data.instagram_details.result.username}`
      : '');

  const handleCopy = async (text: string, label: string) => {
    try {
      // Try modern Clipboard API first (requires HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard`, 'success');
      } else {
        // Fallback for non-secure contexts (HTTP with IP address)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showToast(`${label} copied to clipboard`, 'success');
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Copy failed:', err);
      showToast(`Failed to copy ${label}`, 'error');
    }
  };

  const handleSave = async () => {
    try {
      // Call API to update advertiser
      const response = await fetch('/api/advertisers/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advertiser_id: advertiser.id,
          ad_account_id: editedData.ad_account_id,
          instagram_actor_id: editedData.instagram_actor_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Meta account settings saved successfully', 'success');
        setIsEditing(false);

        // Optionally refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save changes', 'error');
    }
  };

  const handleCancel = () => {
    setEditedData({
      website: website || advertiser.page_data.website || '',
      companyOverview: companyOverview || '',
      ad_account_id: advertiser.ad_account_id || '',
      instagram_actor_id: advertiser.instagram_actor_id || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-20 font-semibold text-text-primary">Advertiser Details</h2>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Facebook Page Data */}
        <div className="card p-6 space-y-4">
          <h3 className="text-16 font-semibold text-text-primary border-b border-divider pb-2">
            Facebook Page Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Page ID */}
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Page ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={page_id}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(page_id, 'Page ID')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Page ID"
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(username, 'Username')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Username"
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Page Name */}
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Page Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={page_data.name}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(page_data.name, 'Page Name')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Page Name"
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-12 text-text-muted font-medium">Category</label>
              <div className="relative">
                <input
                  type="text"
                  value={page_data.category || 'Not set'}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(page_data.category || '', 'Category')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Category"
                  disabled={!page_data.category}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>


            {/* Profile Picture URL */}
            <div className="space-y-2 col-span-2">
              <label className="text-12 text-text-muted font-medium">Profile Picture URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={page_data.profile_picture || 'Not set'}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(page_data.profile_picture || '', 'Profile Picture URL')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Profile Picture URL"
                  disabled={!page_data.profile_picture}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Cover Photo URL */}
            <div className="space-y-2 col-span-2">
              <label className="text-12 text-text-muted font-medium">Cover Photo URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={page_data.cover_image || 'Not set'}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(page_data.cover_image || '', 'Cover Photo URL')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Cover Photo URL"
                  disabled={!page_data.cover_image}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Instagram Handle */}
            {instagramUrl && (
              <div className="space-y-2 col-span-2">
                <label className="text-12 text-text-muted font-medium">Instagram Handle</label>
                <div className="relative">
                  <input
                    type="url"
                    value={instagramUrl}
                    readOnly
                    className="form-input bg-surface-50 pr-10"
                  />
                  <button
                    onClick={() => handleCopy(instagramUrl, 'Instagram Handle')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                    title="Copy Instagram Handle"
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              </div>
            )}

            {/* Meta Ad Account ID */}
            <div className="space-y-2 col-span-2">
              <label className="text-12 text-text-muted font-medium">Meta Ad Account ID</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.ad_account_id}
                  onChange={(e) => setEditedData({ ...editedData, ad_account_id: e.target.value })}
                  placeholder="1234567890 (act_ will be added automatically)"
                  className="form-input"
                />
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={editedData.ad_account_id || 'Not set'}
                    readOnly
                    className="form-input bg-surface-50 pr-10"
                  />
                  <button
                    onClick={() => handleCopy(editedData.ad_account_id || '', 'Meta Ad Account ID')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                    title="Copy Meta Ad Account ID"
                    disabled={!editedData.ad_account_id}
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              )}
            </div>

            {/* Instagram Actor ID */}
            <div className="space-y-2 col-span-2">
              <label className="text-12 text-text-muted font-medium">Instagram Actor ID (Optional)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.instagram_actor_id}
                  onChange={(e) => setEditedData({ ...editedData, instagram_actor_id: e.target.value })}
                  placeholder="Enter Instagram Actor ID"
                  className="form-input"
                />
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={editedData.instagram_actor_id || 'Not set'}
                    readOnly
                    className="form-input bg-surface-50 pr-10"
                  />
                  <button
                    onClick={() => handleCopy(editedData.instagram_actor_id || '', 'Instagram Actor ID')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                    title="Copy Instagram Actor ID"
                    disabled={!editedData.instagram_actor_id}
                  >
                    <Copy className="w-4 h-4 text-text-muted" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="card p-6 space-y-4">
          <h3 className="text-16 font-semibold text-text-primary border-b border-divider pb-2">
            Company Information
          </h3>

          {/* Website */}
          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">Website</label>
            {isEditing ? (
              <input
                type="url"
                value={editedData.website}
                onChange={(e) => setEditedData({ ...editedData, website: e.target.value })}
                placeholder="https://example.com"
                className="form-input"
              />
            ) : (
              <div className="relative">
                <input
                  type="url"
                  value={editedData.website || 'Not set'}
                  readOnly
                  className="form-input bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(editedData.website || '', 'Website')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Website"
                  disabled={!editedData.website}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            )}
          </div>

          {/* Company Overview */}
          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">
              Company Overview
              {isEditing && <span className="text-11 ml-2">({editedData.companyOverview.length}/1000)</span>}
            </label>
            {isEditing ? (
              <textarea
                value={editedData.companyOverview}
                onChange={(e) => setEditedData({ ...editedData, companyOverview: e.target.value.slice(0, 1000) })}
                placeholder="Describe your company, products, and target audience..."
                className="form-textarea h-32"
                maxLength={1000}
              />
            ) : (
              <div className="relative">
                <textarea
                  value={companyOverview || 'Not set'}
                  readOnly
                  className="form-textarea h-32 bg-surface-50 pr-10"
                />
                <button
                  onClick={() => handleCopy(companyOverview || '', 'Company Overview')}
                  className="absolute right-2 top-2 p-1.5 hover:bg-surface-100 rounded transition-colors"
                  title="Copy Company Overview"
                  disabled={!companyOverview}
                >
                  <Copy className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
