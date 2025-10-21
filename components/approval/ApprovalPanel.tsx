import React, { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';
import { ActivityTimeline } from './ActivityTimeline';
import { Check, X, Clock, Users, AlertCircle } from 'lucide-react';
import { showToast } from '@/stores/toastStore';
import type { ApprovalRequestWithDetails } from '@/types/approval';

interface ApprovalPanelProps {
  approvalData: ApprovalRequestWithDetails;
  userEmail?: string;
  onApprovalUpdate?: () => void;
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

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  approvalData,
  userEmail,
  onApprovalUpdate,
}) => {
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
        showToast('Creative rejected', 'info');
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
    <div className="h-full overflow-y-auto bg-surface-50 border-l border-divider">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-18 font-semibold text-text-primary mb-2">Approval Status</h2>
          <div className="flex items-center gap-2">
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
                className="bg-white border border-border rounded-lg p-3"
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
          <div className="space-y-3">
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
  );
};
