import React, { useState } from 'react';
import { X, Edit3, Send } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { Spinner } from '@/components/UI/Spinner';

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldLabel: string;
  fieldPath: string;
  currentValue: string;
  approvalRequestId: number;
  participantId: number;
  onRevisionSubmitted?: () => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  isOpen,
  onClose,
  fieldLabel,
  fieldPath,
  currentValue,
  approvalRequestId,
  participantId,
  onRevisionSubmitted,
}) => {
  const [revisedValue, setRevisedValue] = useState(currentValue);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/approval/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_request_id: approvalRequestId,
          participant_id: participantId,
          element_path: fieldPath,
          original_value: currentValue,
          revised_value: revisedValue,
          comment,
          status: 'pending',
        }),
      });

      const result = await response.json();

      if (result.success) {
        onRevisionSubmitted?.();
        onClose();
      } else {
        alert(result.error || 'Failed to submit revision');
      }
    } catch (error) {
      console.error('Revision submission error:', error);
      alert('Failed to submit revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-18 font-semibold text-text-primary">Suggest Revision</h2>
                <p className="text-13 text-text-muted">{fieldLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Current Value */}
            <div>
              <label className="block text-13 font-medium text-text-muted mb-2">
                Current Copy
              </label>
              <div className="bg-surface-50 border border-border rounded-lg p-4">
                <p className="text-14 text-text-primary whitespace-pre-wrap">{currentValue}</p>
              </div>
            </div>

            {/* Revised Value */}
            <div>
              <label className="block text-13 font-medium text-text-primary mb-2">
                Suggested Revision
              </label>
              <textarea
                value={revisedValue}
                onChange={(e) => setRevisedValue(e.target.value)}
                className="w-full min-h-[120px] px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y text-14"
                placeholder="Enter your suggested revision..."
              />
            </div>

            {/* Comment/Notes */}
            <div>
              <label className="block text-13 font-medium text-text-primary mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-[80px] px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y text-14"
                placeholder="Add any notes or context for this revision..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-divider bg-surface-50">
            <Button
              onClick={onClose}
              variant="ghost"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="default"
              disabled={isSubmitting || !revisedValue.trim()}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Revision
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
