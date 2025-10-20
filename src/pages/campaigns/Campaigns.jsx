import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import Modal from '../../components/ui/Modal'
import { mockCampaigns } from '../../lib/mockData'

export default function Campaigns() {
  const [view, setView] = useState('table')
  const [filter, setFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredCampaigns =
    filter === 'all'
      ? mockCampaigns
      : mockCampaigns.filter((c) => c.status === filter)

  const statusCounts = {
    all: mockCampaigns.length,
    waiting: mockCampaigns.filter((c) => c.status === 'waiting').length,
    in_progress: mockCampaigns.filter((c) => c.status === 'in_progress').length,
    approved: mockCampaigns.filter((c) => c.status === 'approved').length,
    denied: mockCampaigns.filter((c) => c.status === 'denied').length,
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-sp-4">
        <h1 className="meta-page-title mb-0">Campaigns</h1>
        <Button onClick={() => setIsModalOpen(true)}>+ New Campaign</Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-sp-2 mb-sp-4">
        <Button
          variant={view === 'table' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setView('table')}
        >
          Table View
        </Button>
        <Button
          variant={view === 'kanban' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setView('kanban')}
        >
          Kanban View
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-sp-2 mb-sp-4 border-b border-divider">
        {[
          { id: 'all', label: 'All' },
          { id: 'waiting', label: 'Waiting' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'approved', label: 'Approved' },
          { id: 'denied', label: 'Denied' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-sp-4 py-sp-3 border-b-2 transition-colors text-14 font-medium ${
              filter === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}{' '}
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 ml-sp-2 rounded-pill text-11 ${
                filter === tab.id
                  ? 'bg-brand text-white'
                  : 'bg-canvas text-text-muted'
              }`}
            >
              {statusCounts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Table View */}
      {view === 'table' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="meta-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      <strong>{campaign.name}</strong>
                    </td>
                    <td>
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td>
                      <div>
                        {campaign.approved_ads}/{campaign.total_ads} ads approved
                      </div>
                      <ProgressBar
                        value={campaign.approved_ads}
                        max={campaign.total_ads}
                      />
                    </td>
                    <td>{new Date(campaign.start_date).toLocaleDateString()}</td>
                    <td>{new Date(campaign.end_date).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-sp-2">
                        <Button size="small" variant="secondary">
                          View
                        </Button>
                        <Button size="small" variant="secondary">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-sp-4">
          {['waiting', 'in_progress', 'approved', 'denied'].map((status) => (
            <div key={status} className="bg-canvas rounded-card p-sp-3 min-h-[400px]">
              <div className="flex justify-between items-center mb-sp-3 px-sp-2 font-semibold text-14">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <StatusBadge status={status} />
              </div>
              <div className="space-y-sp-3">
                {mockCampaigns
                  .filter((c) => c.status === status)
                  .map((campaign) => (
                    <Card key={campaign.id} className="cursor-pointer hover:shadow-sh-2 transition-shadow">
                      <div className="font-medium mb-sp-2">{campaign.name}</div>
                      <div className="meta-body text-12 flex justify-between">
                        <span>
                          {campaign.approved_ads}/{campaign.total_ads} approved
                        </span>
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString()} -{' '}
                          {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Create Campaign</Button>
          </>
        }
      >
        <div className="space-y-sp-4">
          <div className="meta-form-group">
            <label className="meta-form-label">Campaign Name</label>
            <input
              type="text"
              className="meta-input"
              placeholder="Enter campaign name..."
            />
          </div>
          <div className="meta-form-group">
            <label className="meta-form-label">Description</label>
            <textarea
              className="meta-textarea"
              placeholder="Campaign description..."
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-sp-3">
            <div className="meta-form-group">
              <label className="meta-form-label">Start Date</label>
              <input type="date" className="meta-input" />
            </div>
            <div className="meta-form-group">
              <label className="meta-form-label">End Date</label>
              <input type="date" className="meta-input" />
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
