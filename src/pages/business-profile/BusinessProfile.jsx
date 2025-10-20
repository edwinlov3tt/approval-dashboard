import { useState, useMemo } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import SortableTableHeader from '../../components/ui/SortableTableHeader'
import { mockCompanyProfile, mockApprovers } from '../../lib/mockData'

export default function BusinessProfile() {
  const [activeTab, setActiveTab] = useState('company')
  const [companyInfo, setCompanyInfo] = useState(mockCompanyProfile)
  const [approvers, setApprovers] = useState(mockApprovers)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [sort, setSort] = useState({ key: null, direction: null })
  const [inviteForm, setInviteForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_decision_maker: false,
  })

  const handleInviteApprover = () => {
    // In real app, this would send an API request
    const newApprover = {
      id: approvers.length + 1,
      ...inviteForm,
      status: 'pending',
      invited_at: new Date().toISOString(),
      accepted_at: null,
    }
    setApprovers([...approvers, newApprover])
    setIsInviteModalOpen(false)
    setInviteForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      is_decision_maker: false,
    })
  }

  const handleRemoveApprover = (id) => {
    setApprovers(approvers.filter((a) => a.id !== id))
  }

  const sortedApprovers = useMemo(() => {
    if (!sort.key || !sort.direction) return approvers

    return [...approvers].sort((a, b) => {
      let aValue, bValue

      // Handle special cases
      if (sort.key === 'name') {
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase()
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase()
      } else {
        aValue = a[sort.key]
        bValue = b[sort.key]
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })
  }, [approvers, sort])

  return (
    <Layout>
      <h1 className="meta-page-title">Business Profile</h1>

      {/* Tabs */}
      <div className="flex gap-sp-2 mb-sp-6 border-b border-divider">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-sp-4 py-sp-3 border-b-2 transition-colors text-14 font-medium ${
            activeTab === 'company'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Company Information
        </button>
        <button
          onClick={() => setActiveTab('approvers')}
          className={`px-sp-4 py-sp-3 border-b-2 transition-colors text-14 font-medium ${
            activeTab === 'approvers'
              ? 'border-brand text-brand'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Approvers
        </button>
      </div>

      {/* Company Information Tab */}
      {activeTab === 'company' && (
        <Card>
          <div className="space-y-sp-5">
            {/* Company Logo */}
            <div className="meta-form-group">
              <label className="meta-form-label">Company Logo</label>
              <div className="flex items-center gap-sp-4">
                <div className="w-20 h-20 rounded-md bg-brand flex items-center justify-center text-white font-semibold text-28">
                  {companyInfo.company_name.charAt(0)}
                </div>
                <Button variant="secondary">Upload Logo</Button>
              </div>
            </div>

            {/* Company Name */}
            <div className="meta-form-group">
              <label className="meta-form-label">Company Name</label>
              <input
                type="text"
                className="meta-input"
                value={companyInfo.company_name}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, company_name: e.target.value })
                }
              />
            </div>

            {/* Category */}
            <div className="meta-form-group">
              <label className="meta-form-label">Category</label>
              <input
                type="text"
                className="meta-input"
                value={companyInfo.category}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, category: e.target.value })
                }
              />
            </div>

            {/* Website */}
            <div className="meta-form-group">
              <label className="meta-form-label">Website</label>
              <input
                type="url"
                className="meta-input"
                value={companyInfo.website}
                onChange={(e) =>
                  setCompanyInfo({ ...companyInfo, website: e.target.value })
                }
              />
            </div>

            {/* Social Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-4">
              <div className="meta-form-group">
                <label className="meta-form-label">Facebook Page Username</label>
                <input
                  type="text"
                  className="meta-input"
                  placeholder="username"
                  value={companyInfo.facebook_page}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, facebook_page: e.target.value })
                  }
                />
              </div>
              <div className="meta-form-group">
                <label className="meta-form-label">Facebook Page ID</label>
                <input
                  type="text"
                  className="meta-input"
                  value={companyInfo.facebook_page_id}
                  onChange={(e) =>
                    setCompanyInfo({
                      ...companyInfo,
                      facebook_page_id: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="meta-form-group">
              <label className="meta-form-label">Instagram Account</label>
              <input
                type="text"
                className="meta-input"
                placeholder="@username"
                value={companyInfo.instagram_account}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    instagram_account: e.target.value,
                  })
                }
              />
            </div>

            {/* Company Overview */}
            <div className="meta-form-group">
              <label className="meta-form-label">Company Overview</label>
              <textarea
                className="meta-textarea"
                rows={4}
                value={companyInfo.company_overview}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    company_overview: e.target.value,
                  })
                }
              ></textarea>
            </div>

            <Button>Save Changes</Button>
          </div>
        </Card>
      )}

      {/* Approvers Tab */}
      {activeTab === 'approvers' && (
        <div className="space-y-sp-4">
          <div className="flex justify-between items-center">
            <p className="meta-body">
              Manage people who can approve campaigns for your business.
            </p>
            <Button onClick={() => setIsInviteModalOpen(true)}>+ Invite Approver</Button>
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="meta-table">
                <thead>
                  <tr>
                    <SortableTableHeader
                      label="Name"
                      sortKey="name"
                      currentSort={sort}
                      onSort={setSort}
                    />
                    <SortableTableHeader
                      label="Email"
                      sortKey="email"
                      currentSort={sort}
                      onSort={setSort}
                    />
                    <th>Phone</th>
                    <th>Role</th>
                    <SortableTableHeader
                      label="Status"
                      sortKey="status"
                      currentSort={sort}
                      onSort={setSort}
                    />
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApprovers.map((approver) => (
                    <tr key={approver.id}>
                      <td>
                        <div className="font-medium">
                          {approver.first_name} {approver.last_name}
                        </div>
                      </td>
                      <td>{approver.email}</td>
                      <td className="text-12">{approver.phone}</td>
                      <td>
                        {approver.is_decision_maker ? (
                          <span className="meta-chip bg-blue-100 text-blue-800 border-blue-300">
                            Decision Maker
                          </span>
                        ) : (
                          <span className="meta-chip bg-gray-100 text-gray-800 border-gray-300">
                            Approver
                          </span>
                        )}
                      </td>
                      <td>
                        {approver.status === 'active' ? (
                          <span className="meta-chip meta-chip-approved">Active</span>
                        ) : (
                          <span className="meta-chip meta-chip-waiting">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-sp-2">
                          <Button size="small" variant="secondary">
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleRemoveApprover(approver.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start gap-sp-3">
              <div className="text-blue-600 text-20">ℹ</div>
              <div>
                <h3 className="font-semibold text-14 mb-sp-2">About Decision Makers</h3>
                <p className="text-14 text-text-secondary">
                  Decision Makers can approve campaigns without needing additional
                  approval from other approvers. Regular approvers need at least one
                  Decision Maker to also approve before a campaign can move forward.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Invite Approver Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Approver"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteApprover}>Send Invite</Button>
          </>
        }
      >
        <div className="space-y-sp-4">
          <div className="grid grid-cols-2 gap-sp-3">
            <div className="meta-form-group">
              <label className="meta-form-label">First Name</label>
              <input
                type="text"
                className="meta-input"
                value={inviteForm.first_name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, first_name: e.target.value })
                }
              />
            </div>
            <div className="meta-form-group">
              <label className="meta-form-label">Last Name</label>
              <input
                type="text"
                className="meta-input"
                value={inviteForm.last_name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="meta-form-group">
            <label className="meta-form-label">Email</label>
            <input
              type="email"
              className="meta-input"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, email: e.target.value })
              }
            />
          </div>

          <div className="meta-form-group">
            <label className="meta-form-label">Phone</label>
            <input
              type="tel"
              className="meta-input"
              value={inviteForm.phone}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, phone: e.target.value })
              }
            />
          </div>

          <div className="meta-form-group">
            <label className="flex items-center gap-sp-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={inviteForm.is_decision_maker}
                onChange={(e) =>
                  setInviteForm({
                    ...inviteForm,
                    is_decision_maker: e.target.checked,
                  })
                }
              />
              <span className="text-14">Make this person a Decision Maker</span>
            </label>
            <p className="text-12 text-text-muted mt-sp-2">
              Decision Makers can approve campaigns without additional approval.
            </p>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
