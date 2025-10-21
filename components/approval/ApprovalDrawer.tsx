import React, { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { ActivityTimeline } from './ActivityTimeline';
import { Check, X, Clock, Users, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import type { ApprovalRequestWithDetails } from '@/types/approval';

interface ApprovalDrawerProps {
  approvalData: ApprovalRequestWithDetails;
  userEmail?: string;
  onApprovalUpdate?: () => void;
  defaultOpen?: boolean;
  onReject?: () => void;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="w-3 h-3" /> },
    in_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Users className="w-3 h-3" /> },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: <Check className="w-3 h-3" /> },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: <X className="w-3 h-3" /> },
  };

  const style = styles[status] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.icon}
      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

export const ApprovalDrawer: React.FC<ApprovalDrawerProps> = ({
  approvalData,
  userEmail,
  onApprovalUpdate,
  defaultOpen = true,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find current user's participant record
  const currentParticipant = userEmail
    ? approvalData.participants.find(p => p.email.toLowerCase() === userEmail.toLowerCase())
    : null;

  // Check if user can approve
  const canApprove =
    currentParticipant &&
    currentParticipant.tier === approvalData.current_tier &&
    currentParticipant.status === 'pending';

  // Get current tier participants
  const tierParticipants = approvalData.participants.filter(
    p => p.tier === approvalData.current_tier
  );

  const handleApprove = async () => {
    if (!currentParticipant) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/approval/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalData.id,
          participant_id: currentParticipant.id,
          status: 'approved',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Creative approved successfully', 'success');
        onApprovalUpdate?.();
      } else {
        showToast(result.error || 'Failed to submit approval', 'error');
      }
    } catch (error) {
      console.error('Approval submission error:', error);
      showToast('Failed to submit approval', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentParticipant) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/approval/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalData.id,
          participant_id: currentParticipant.id,
          status: 'rejected',
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Creative rejected - Click on form fields to suggest revisions', 'info');

        // Close the drawer
        setIsOpen(false);

        // Trigger the onReject callback to open the left panel
        onReject?.();

        onApprovalUpdate?.();
      } else {
        showToast(result.error || 'Failed to submit rejection', 'error');
      }
    } catch (error) {
      console.error('Rejection submission error:', error);
      showToast('Failed to submit rejection', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tierName = approvalData.current_tier === 1 ? 'Client' : approvalData.current_tier === 2 ? 'Account Executive' : 'Digital Campaign Manager';

  return (
    <>
      {/* Collapsed State - Button on the right edge */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-primary-dark transition-all z-50 flex flex-col items-center gap-2"
          aria-label="Open approval panel"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl' }}>
            Approval
          </span>
        </button>
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-full bg-white border-l border-divider shadow-2xl transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '380px' }}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-divider bg-surface-50">
          <h2 className="text-16 font-semibold text-text-primary">Approval Status</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-surface-100 rounded transition-colors"
            aria-label="Close approval panel"
          >
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(approvalData.status)}
                <span className="text-12 text-text-muted">
                  Tier {approvalData.current_tier}: {tierName}
                </span>
              </div>
            </div>

            {/* Expiration */}
            {approvalData.expires_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-12 text-blue-700">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Expires: {new Date(approvalData.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Current Tier Participants */}
            <div>
              <h3 className="text-14 font-semibold text-text-primary mb-3">Current Reviewers</h3>
              <div className="space-y-2">
                {tierParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="bg-surface-50 border border-border rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-13 font-medium text-text-primary truncate">
                          {participant.name || participant.email}
                        </p>
                        <p className="text-11 text-text-muted truncate">{participant.email}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(participant.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {canApprove && (
              <div className="space-y-3 sticky bottom-0 bg-white pt-4 pb-2 border-t border-divider">
                <h3 className="text-14 font-semibold text-text-primary">Your Review</h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleApprove}
                    variant="default"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {!canApprove && currentParticipant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-12 text-blue-700">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  {currentParticipant.status === 'approved' || currentParticipant.status === 'rejected'
                    ? `You have already ${currentParticipant.status} this creative.`
                    : `Waiting for Tier ${approvalData.current_tier} review.`}
                </p>
              </div>
            )}

            {/* Activity Timeline */}
            <div>
              <h3 className="text-14 font-semibold text-text-primary mb-3">Activity</h3>
              <ActivityTimeline activities={approvalData.activity || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
