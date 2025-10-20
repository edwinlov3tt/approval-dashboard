import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { mockAds } from '../../lib/mockData'

export default function Ads() {
  const [view, setView] = useState('cards')
  const [filter, setFilter] = useState('all')

  const filteredAds =
    filter === 'all' ? mockAds : mockAds.filter((ad) => ad.status === filter)

  const statusCounts = {
    all: mockAds.length,
    waiting: mockAds.filter((ad) => ad.status === 'waiting').length,
    in_progress: mockAds.filter((ad) => ad.status === 'in_progress').length,
    approved: mockAds.filter((ad) => ad.status === 'approved').length,
    denied: mockAds.filter((ad) => ad.status === 'denied').length,
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-sp-4">
        <h1 className="meta-page-title mb-0">All Ads</h1>
      </div>

      {/* View Toggle */}
      <div className="flex gap-sp-2 mb-sp-4">
        <Button
          variant={view === 'cards' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setView('cards')}
        >
          Card View
        </Button>
        <Button
          variant={view === 'table' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setView('table')}
        >
          Table View
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

      {/* Card View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sp-4">
          {filteredAds.map((ad) => (
            <Card key={ad.id} className="hover:shadow-sh-2 transition-shadow cursor-pointer">
              <div className="space-y-sp-3">
                {/* Ad Header */}
                <div className="flex justify-between items-start">
                  <StatusBadge status={ad.status} />
                  <span className="meta-body text-12 text-text-muted">
                    {ad.short_id}
                  </span>
                </div>

                {/* Ad Title */}
                <div>
                  <h3 className="font-semibold text-16 mb-sp-2">{ad.name}</h3>
                  <p className="meta-body text-12 text-text-muted mb-sp-2">
                    {ad.description}
                  </p>
                </div>

                {/* Ad Details */}
                <div className="space-y-1">
                  <div className="flex justify-between text-12">
                    <span className="text-text-muted">Campaign:</span>
                    <span className="text-text-primary font-medium">
                      {ad.campaign_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-12">
                    <span className="text-text-muted">Format:</span>
                    <span className="text-text-primary">{ad.format}</span>
                  </div>
                  <div className="flex justify-between text-12">
                    <span className="text-text-muted">Dimensions:</span>
                    <span className="text-text-primary">{ad.dimensions}</span>
                  </div>
                  <div className="flex justify-between text-12">
                    <span className="text-text-muted">Created:</span>
                    <span className="text-text-primary">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-sp-2 border-t border-divider">
                  <Button size="small" className="w-full">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="meta-table">
              <thead>
                <tr>
                  <th>Ad Name</th>
                  <th>Campaign</th>
                  <th>Format</th>
                  <th>Dimensions</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.map((ad) => (
                  <tr key={ad.id}>
                    <td>
                      <div>
                        <div className="font-medium">{ad.name}</div>
                        <div className="text-12 text-text-muted">{ad.description}</div>
                      </div>
                    </td>
                    <td>{ad.campaign_name}</td>
                    <td>
                      <span className="inline-flex items-center px-sp-2 py-1 bg-canvas rounded text-12">
                        {ad.format}
                      </span>
                    </td>
                    <td className="text-12 text-text-muted">{ad.dimensions}</td>
                    <td>
                      <StatusBadge status={ad.status} />
                    </td>
                    <td className="text-12">
                      {new Date(ad.created_at).toLocaleDateString()}
                    </td>
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
    </Layout>
  )
}
