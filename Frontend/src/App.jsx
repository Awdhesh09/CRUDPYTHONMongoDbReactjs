import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const emptyUser = { name: '', email: '', contact: '', address: '' };

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Something went wrong.');
  return body;
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      setUsers(await request('/users'));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.contact, user.address].some((value) =>
      value.toLowerCase().includes(query.toLowerCase()),
    ),
  );

  function openCreate() {
    setForm(emptyUser);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setForm({ name: user.name, email: user.email, contact: user.contact, address: user.address });
    setEditingId(user._id);
    setModalOpen(true);
  }

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await request(editingId ? `/users/${editingId}` : '/users', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await loadUsers();
      await Swal.fire({ icon: 'success', title: editingId ? 'Contact updated' : 'Contact added', timer: 1300, showConfirmButton: false });
    } catch (saveError) {
      Swal.fire({ icon: 'error', title: 'Could not save contact', text: saveError.message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    const result = await Swal.fire({
      title: 'Remove this contact?',
      text: `${user.name} will be deleted from your directory.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete contact',
      cancelButtonText: 'Keep contact',
      confirmButtonColor: '#b94c3c',
    });
    if (!result.isConfirmed) return;
    try {
      await request(`/users/${user._id}`, { method: 'DELETE' });
      await loadUsers();
      await Swal.fire({ icon: 'success', title: 'Contact deleted', timer: 1200, showConfirmButton: false });
    } catch (deleteError) {
      Swal.fire({ icon: 'error', title: 'Could not delete contact', text: deleteError.message });
    }
  }

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <a className="brand-mark" href="#top" aria-label="Fieldnotes home">f<span>.</span></a>
        <div className="rail-rule" />
        <button className="rail-button active" aria-label="People"><i className="bi bi-people" /></button>
        <button className="rail-button" aria-label="Activity"><i className="bi bi-activity" /></button>
        <div className="rail-bottom"><span className="user-dot">JD</span></div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <div className="breadcrumb-label"><span>Workspace</span><i className="bi bi-chevron-right" /><strong>People</strong></div>
          <div className="topbar-right"><span className="sync-state"><span /> Directory</span><button className="avatar-button" aria-label="Account">JD</button></div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR NETWORK <span> / </span> DIRECTORY</p>
              <h1>People<span className="heading-period">.</span></h1>
              <p className="page-subtitle">A thoughtful place for the people you work with.</p>
            </div>
            <button className="btn add-button" onClick={openCreate}><i className="bi bi-plus-lg" /> Add person</button>
          </div>

          <div className="stats-row">
            <div className="stat-item"><span className="stat-number">{users.length.toString().padStart(2, '0')}</span><span className="stat-caption">TOTAL CONTACTS</span></div>
            <div className="stat-divider" />
            <div className="stat-item"><span className="stat-number">{filteredUsers.length.toString().padStart(2, '0')}</span><span className="stat-caption">SHOWING</span></div>
            <div className="stats-note"><i className="bi bi-arrow-up-right" /> Your directory, in good order</div>
          </div>

          <section className="directory-panel" aria-label="People directory">
            <div className="directory-toolbar">
              <div className="panel-title"><span className="panel-mark" /> <h2>All people</h2><span className="count-pill">{filteredUsers.length}</span></div>
              <label className="search-box"><i className="bi bi-search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" aria-label="Search people" /><kbd>/</kbd></label>
            </div>

            <div className="table-responsive">
              <table className="table people-table align-middle mb-0">
                <thead><tr><th>NAME</th><th>EMAIL</th><th>PHONE</th><th>ADDRESS</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan="5" className="table-message"><span className="spinner-border spinner-border-sm" /> Loading directory</td></tr>}
                  {!loading && error && <tr><td colSpan="5" className="table-message error-message"><i className="bi bi-exclamation-circle" /> {error} <button className="retry-button" onClick={loadUsers}>Retry</button></td></tr>}
                  {!loading && !error && filteredUsers.map((user, index) => (
                    <tr key={user._id}>
                      <td><div className="person-cell"><span className={`person-avatar tone-${index % 5}`}>{initials(user.name)}</span><span className="person-name">{user.name}</span></div></td>
                      <td><a className="email-link" href={`mailto:${user.email}`}>{user.email}</a></td>
                      <td className="muted-cell">{user.contact}</td>
                      <td className="muted-cell address-cell">{user.address}</td>
                      <td><div className="row-actions"><button aria-label={`Edit ${user.name}`} title="Edit contact" onClick={() => openEdit(user)}><i className="bi bi-pencil" /></button><button aria-label={`Delete ${user.name}`} title="Delete contact" onClick={() => deleteUser(user)}><i className="bi bi-trash3" /></button></div></td>
                    </tr>
                  ))}
                  {!loading && !error && filteredUsers.length === 0 && <tr><td colSpan="5" className="table-message empty-message"><i className="bi bi-person-plus" /><strong>{query ? 'No matches found' : 'Your directory is waiting'}</strong><span>{query ? 'Try another name, email, phone, or address.' : 'Add your first person to get started.'}</span>{!query && <button className="text-action" onClick={openCreate}>Add a person <i className="bi bi-arrow-right" /></button>}</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>FIELDNOTES <span className="footer-slash">/</span> CONTACTS</span><span>{filteredUsers.length} {filteredUsers.length === 1 ? 'PERSON' : 'PEOPLE'}</span></footer>
          </section>
          <div className="page-end-note"><span>Keep the good people close.</span><span>EST. 2026</span></div>
        </div>
      </section>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><p className="eyebrow">DIRECTORY ENTRY</p><h2 id="modal-title">{editingId ? 'Edit person' : 'Add a person'}<span className="heading-period">.</span></h2></div><button className="close-button" onClick={() => setModalOpen(false)} aria-label="Close dialog"><i className="bi bi-x-lg" /></button></div>
          <form onSubmit={saveUser}>
            <label className="form-field">Full name<input required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Morgan Lee" /></label>
            <label className="form-field">Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="morgan@example.com" /></label>
            <div className="form-split"><label className="form-field">Phone number<input required type="tel" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="+1 555 0100" /></label><label className="form-field">Address<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="City, country" /></label></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="btn add-button" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm" /> Saving</> : <><i className="bi bi-check2" /> {editingId ? 'Save changes' : 'Add person'}</>}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}