import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { mockUserProfile } from '../../lib/mockData'

export default function Profile() {
  const [profile, setProfile] = useState(mockUserProfile)
  const [isVacationMode, setIsVacationMode] = useState(profile.is_on_vacation)

  return (
    <Layout>
      <h1 className="meta-page-title">Profile Settings</h1>

      <Card>
        <div className="space-y-sp-5">
          {/* Profile Photo */}
          <div className="meta-form-group">
            <label className="meta-form-label">Profile Photo</label>
            <div className="flex items-center gap-sp-3">
              <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center font-medium text-24">
                {profile.first_name[0]}
                {profile.last_name[0]}
              </div>
              <Button variant="secondary">Upload Photo</Button>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-4">
            <div className="meta-form-group">
              <label className="meta-form-label">First Name</label>
              <input
                type="text"
                className="meta-input"
                value={profile.first_name}
                onChange={(e) =>
                  setProfile({ ...profile, first_name: e.target.value })
                }
              />
            </div>
            <div className="meta-form-group">
              <label className="meta-form-label">Last Name</label>
              <input
                type="text"
                className="meta-input"
                value={profile.last_name}
                onChange={(e) =>
                  setProfile({ ...profile, last_name: e.target.value })
                }
              />
            </div>
          </div>

          {/* Email */}
          <div className="meta-form-group">
            <label className="meta-form-label">Email</label>
            <input
              type="email"
              className="meta-input"
              value={profile.email}
              readOnly
            />
            <div className="meta-body text-success mt-sp-2">Verified</div>
          </div>

          {/* Phone */}
          <div className="meta-form-group">
            <label className="meta-form-label">Phone</label>
            <input
              type="tel"
              className="meta-input"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <hr className="border-divider" />

          {/* Vacation Mode */}
          <div className="meta-form-group">
            <label className="meta-form-label">Vacation Mode</label>
            <div className="p-sp-3 bg-canvas rounded-md">
              <label className="flex items-center gap-sp-2 mb-sp-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVacationMode}
                  onChange={(e) => setIsVacationMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-14">I'm going on vacation</span>
              </label>

              {isVacationMode && (
                <>
                  <div className="grid grid-cols-2 gap-sp-3 mb-sp-3">
                    <div>
                      <label className="meta-form-label text-12">Start Date</label>
                      <input type="date" className="meta-input" />
                    </div>
                    <div>
                      <label className="meta-form-label text-12">End Date</label>
                      <input type="date" className="meta-input" />
                    </div>
                  </div>

                  <div className="meta-form-group">
                    <label className="meta-form-label text-12">
                      Auto-reply message
                    </label>
                    <textarea
                      className="meta-textarea"
                      placeholder="I'm out of office until..."
                    ></textarea>
                  </div>
                </>
              )}
            </div>
          </div>

          <hr className="border-divider" />

          {/* Change Password */}
          <div>
            <h2 className="meta-section-title">Change Password</h2>
            <div className="space-y-sp-4">
              <div className="meta-form-group">
                <label className="meta-form-label">Current Password</label>
                <input type="password" className="meta-input" />
              </div>
              <div className="meta-form-group">
                <label className="meta-form-label">New Password</label>
                <input type="password" className="meta-input" />
              </div>
              <div className="meta-form-group">
                <label className="meta-form-label">Confirm New Password</label>
                <input type="password" className="meta-input" />
              </div>
            </div>
          </div>

          <Button>Save Changes</Button>
        </div>
      </Card>
    </Layout>
  )
}
