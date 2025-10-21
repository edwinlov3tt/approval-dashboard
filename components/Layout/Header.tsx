import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, RotateCcw, Save, FileImage, ChevronDown, AlertCircle, Check, Share2, Eye, UserCheck, Send } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { ApprovalShareModal } from '@/components/approval/ApprovalShareModal';
import { PresenceChips } from '@/components/approval/PresenceChips';
import { useApproval } from '@/contexts/ApprovalContext';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';
import type { ApprovalShareFormData } from '@/types/approval';

export const Header: React.FC = () => {
  const location = useLocation();
  const activeCreativeName = useCreativeStore(state => state.adCopy.adName || 'Creative Preview');
  const isDirty = useCreativeStore(state => state.isDirty);
  const isPreviewMode = useCreativeStore(state => state.isPreviewMode);
  const pageData = useCreativeStore(state => state.facebook.pageData);
  const advertiserIdentifier = useCreativeStore(state => state.advertiserIdentifier);
  const resetStore = useCreativeStore(state => state.resetStore);
  const saveSnapshot = useCreativeStore(state => state.saveSnapshot);
  const copySpecToClipboard = useCreativeStore(state => state.copySpecToClipboard);
  const downloadSpecJson = useCreativeStore(state => state.downloadSpecJson);
  const downloadSpecSheet = useCreativeStore(state => state.downloadSpecSheet);
  const downloadBundle = useCreativeStore(state => state.downloadBundle);
  const exportPreviewImage = useCreativeStore(state => state.exportPreviewImage);
  const saveAndShare = useCreativeStore(state => state.saveAndShare);
  const shareState = useCreativeStore(state => state.share);
  const aiState = useCreativeStore(state => state.ai);
  const autosave = useCreativeStore(state => state.autosave);
  const isSaving = autosave.isSaving ?? false;
  const saveError = autosave.error ?? null;
  const lastSavedAt = autosave.lastSavedAt ?? null;

  // Approval/Revision state (only available in preview mode with ApprovalProvider)
  let isRevisionMode = false;
  let revisionCount = 0;
  let revisions: Record<string, any> = {};
  let clearRevisions: (() => void) | undefined;
  let approvalData: any = null;
  let userEmail: string | null = null;

  try {
    const approvalContext = useApproval();
    isRevisionMode = approvalContext.isRevisionMode;
    revisionCount = approvalContext.revisionCount;
    revisions = approvalContext.revisions;
    clearRevisions = approvalContext.clearRevisions;
    approvalData = approvalContext.approvalData;
    userEmail = approvalContext.userEmail;
  } catch {
    // Not in ApprovalProvider context, ignore
  }

  // Advertiser display logic for preview mode
  const advertiserName = pageData?.name || 'Meta Creative Preview';
  const advertiserProfilePicture = pageData?.profile_picture;

  // Check if in approval mode
  const isApprovalMode = location.pathname.startsWith('/approval/');

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'png' | 'jpg' | 'bundle' | 'excel' | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSendingRevisions, setIsSendingRevisions] = useState(false);

  const autosaveStatus = useMemo(() => {
    if (isSaving) {
      return { icon: <Save className="w-4 h-4 text-primary animate-pulse" />, label: 'Saving…', tone: 'text-primary' as const };
    }
    if (saveError) {
      return { icon: <AlertCircle className="w-4 h-4 text-danger" />, label: 'Autosave failed', tone: 'text-danger' as const };
    }
    if (lastSavedAt) {
      const formatted = new Date(lastSavedAt).toLocaleTimeString();
      return { icon: <Check className="w-4 h-4 text-success" />, label: `Auto-saved ${formatted}`, tone: 'text-text-muted' as const };
    }
    return null;
  }, [isSaving, saveError, lastSavedAt]);

  const handleReset = () => {
    resetStore();
    showToast('Workspace reset', 'info');
  };

  const handleSave = () => {
    const timestamp = Date.now();
    saveSnapshot(timestamp);
    showToast('Workspace saved', 'success');
  };

  const handleCopy = async () => {
    await copySpecToClipboard();
  };

  const handleDownloadBundle = async () => {
    setIsExporting('bundle');
    try {
      await downloadBundle();
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadExcel = async () => {
    setIsExporting('excel');
    try {
      await downloadSpecSheet();
    } finally {
      setIsExporting(null);
    }
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    setIsExporting(format);
    try {
      await exportPreviewImage(format);
    } catch (error) {
      console.error('Preview export failed', error);
      showToast('Preview export failed', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleShare = async () => {
    await saveAndShare();
  };

  const handleInitiateApproval = async (formData: ApprovalShareFormData) => {
    try {
      let shortId: string | null = null;
      let identifier: string | null = null;

      // If in preview mode, extract shortId from URL
      if (isPreviewMode) {
        const pathParts = location.pathname.split('/');
        const adIndex = pathParts.indexOf('ad');
        if (adIndex !== -1 && pathParts[adIndex + 1]) {
          shortId = pathParts[adIndex + 1];
        }
        identifier = advertiserIdentifier;
      } else {
        // Otherwise, ensure the ad is saved first
        if (!shareState.shortId) {
          await saveAndShare();
        }

        // Get fresh state after save
        const freshState = useCreativeStore.getState();
        shortId = freshState.share.shortId;
        identifier = freshState.advertiserIdentifier;
      }

      if (!shortId || !identifier) {
        showToast('Please save the ad first', 'error');
        return;
      }

      // Get ad ID and advertiser ID from backend
      const adResponse = await fetch(`/api/ad/${identifier}/${shortId}`);
      const adResult = await adResponse.json();

      if (!adResult.success || !adResult.data?.ad?.id || !adResult.data?.advertiser?.id) {
        showToast('Failed to load ad details', 'error');
        return;
      }

      const adId = adResult.data.ad.id;
      const advertiserId = adResult.data.advertiser.id;

      // Create approval request
      const response = await fetch('/api/approval/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: adId,
          advertiser_id: advertiserId,
          form_data: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (formData.share_method === 'link' && result.data.share_url) {
          // Copy share URL to clipboard
          await navigator.clipboard.writeText(result.data.share_url);
          showToast('Approval link copied to clipboard', 'success');
        } else if (formData.share_method === 'email') {
          showToast(`Approval emails sent to ${result.data.emails_sent} participants`, 'success');
        }
      } else {
        showToast(result.error || 'Failed to initiate approval', 'error');
      }
    } catch (error) {
      console.error('Approval initiation error:', error);
      showToast('Failed to initiate approval', 'error');
    }
  };

  const handleSendRevisions = async () => {
    if (!approvalData || !userEmail || revisionCount === 0) {
      showToast('No revisions to send', 'info');
      return;
    }

    try {
      setIsSendingRevisions(true);

      // Find current participant
      const participant = approvalData.participants.find((p: any) => p.email === userEmail);
      if (!participant) {
        showToast('Participant not found', 'error');
        return;
      }

      // Send all revisions to the API
      const revisionPromises = Object.values(revisions).map((revision: any) =>
        fetch('/api/approval/revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approval_request_id: approvalData.id,
            participant_id: participant.id,
            element_path: revision.fieldPath,
            original_value: revision.originalValue,
            revised_value: revision.revisedValue,
            status: 'pending',
          }),
        })
      );

      const results = await Promise.all(revisionPromises);
      const allSuccessful = results.every(async (r) => {
        const json = await r.json();
        return json.success;
      });

      if (allSuccessful) {
        // Create activity log for revision submission
        const fieldNames = Object.values(revisions).map((r: any) => r.fieldLabel);
        await fetch('/api/approval/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approval_request_id: approvalData.id,
            event_type: 'revision_submitted',
            user_email: userEmail,
            user_name: participant.name || null,
            metadata: {
              revision_count: revisionCount,
              fields: fieldNames,
            },
          }),
        });

        showToast(`${revisionCount} revision(s) submitted successfully`, 'success');
        clearRevisions?.();
      } else {
        showToast('Some revisions failed to submit', 'error');
      }
    } catch (error) {
      console.error('Error sending revisions:', error);
      showToast('Failed to send revisions', 'error');
    } finally {
      setIsSendingRevisions(false);
    }
  };

  return (
    <header className="bg-white border-b border-surface-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isPreviewMode && advertiserIdentifier ? (
            <Link
              to={`/advertiser/${advertiserIdentifier}`}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              title="View all ads from this advertiser"
            >
              {advertiserProfilePicture ? (
                <img
                  src={advertiserProfilePicture}
                  alt={advertiserName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-meta-blue rounded-lg flex items-center justify-center text-white font-semibold">
                  {advertiserName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ) : isPreviewMode && advertiserProfilePicture ? (
            <img
              src={advertiserProfilePicture}
              alt={advertiserName}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-meta-blue rounded-lg flex items-center justify-center text-white font-semibold">
              C
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-surface-900">
              {isPreviewMode ? advertiserName : 'Meta Creative Builder'}
            </h1>
            <p className="text-sm text-surface-600 flex items-center gap-2">
              {activeCreativeName}
              {isPreviewMode ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    <Eye className="w-3 h-3" />
                    {isApprovalMode ? 'Approval Mode' : 'Preview Mode'}
                  </span>
                  {isRevisionMode && revisionCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      {revisionCount} Revision{revisionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {isApprovalMode && approvalData && (
                    <PresenceChips
                      approvalRequestId={approvalData.id}
                      userEmail={userEmail || undefined}
                      userName={userEmail || undefined}
                    />
                  )}
                </>
              ) : (
                isDirty && <span className="text-warning">• Unsaved changes</span>
              )}
            </p>
          </div>
        </div>

        {/* Preview Mode Actions - Revision Submission */}
        {isPreviewMode && isRevisionMode && revisionCount > 0 && (
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSendRevisions}
              variant="meta"
              size="sm"
              disabled={isSendingRevisions}
            >
              {isSendingRevisions ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Revisions ({revisionCount})
                </>
              )}
            </Button>
          </div>
        )}

        {!isPreviewMode && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Button onClick={handleReset} variant="ghost" size="sm" title="Reset all form data">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} variant="outline" size="sm" title="Save current fields locally" disabled={aiState.isGenerating}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>

            <div className="h-8 w-px bg-surface-200" />

            {autosaveStatus && (
              <div className="hidden md:flex items-center gap-2 text-12">
                {autosaveStatus.icon}
                <span className={autosaveStatus.tone}>{autosaveStatus.label}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                title="Save and get shareable link"
                disabled={shareState.isSaving}
              >
                {shareState.isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowApprovalModal(true)}
                variant="outline"
                size="sm"
                title="Share for approval"
                disabled={shareState.isSaving}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Request Approval
              </Button>
              <div className="relative">
                <Button
                  onClick={() => setExportMenuOpen(prev => !prev)}
                  variant="outline"
                  size="sm"
                  title="Export preview or spec"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
                {exportMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-white shadow-lg text-12 text-text-primary py-2 z-50"
                    onMouseLeave={() => setExportMenuOpen(false)}
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-surface-100 flex items-center"
                      onClick={() => { setExportMenuOpen(false); void handleExport('png'); }}
                      disabled={isExporting === 'png'}
                    >
                      {isExporting === 'png' && <Spinner size="sm" className="mr-2" />}
                      Preview PNG
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-surface-100 flex items-center"
                      onClick={() => { setExportMenuOpen(false); void handleExport('jpg'); }}
                      disabled={isExporting === 'jpg'}
                    >
                      {isExporting === 'jpg' && <Spinner size="sm" className="mr-2" />}
                      Preview JPG
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-surface-100 flex items-center"
                      onClick={() => { setExportMenuOpen(false); void handleDownloadExcel(); }}
                      disabled={isExporting === 'excel'}
                    >
                      {isExporting === 'excel' && <Spinner size="sm" className="mr-2" />}
                      Spec Sheet (.xlsx)
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-surface-100"
                      onClick={() => { setExportMenuOpen(false); downloadSpecJson(); }}
                    >
                      Spec JSON (.json)
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-surface-100"
                      onClick={() => { setExportMenuOpen(false); void handleCopy(); }}
                    >
                      Copy JSON to Clipboard
                    </button>
                  </div>
                )}
              </div>
              <Button
                onClick={() => { void handleDownloadBundle(); }}
                variant="meta"
                size="sm"
                title="Download zip bundle"
                disabled={isExporting === 'bundle'}
              >
                {isExporting === 'bundle' ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Spec
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {!isPreviewMode && pageData && (
        <ApprovalShareModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          adId={0}
          advertiserId={0}
          onSubmit={handleInitiateApproval}
        />
      )}
    </header>
  );
};
