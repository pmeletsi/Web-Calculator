# Story 10.6: `pages/AdminUsers.jsx` — create/delete accounts

Status: ready-for-dev

## Story

As **an Admin**,
I want **a page listing all accounts with controls to create a new one or delete an existing one**,
so that **I can manage accounts entirely from the UI, as the training brief requires**.

## Acceptance Criteria

1. `src/pages/AdminUsers.jsx` renders an MUI `Table` of all users (`GET /api/admin/users`): columns `Username`, `Role`, `Created At`.
2. An "Add user" button opens an MUI `Dialog` with `Username`, `Password`, `Role` (select: User/Admin) fields; submitting calls `POST /api/admin/users`.
   - Client-side validation mirrors Story 10.3's server rules (non-empty username, password ≥ 4 chars) — disables the dialog's submit button until valid, in addition to the server being the source of truth.
   - `409` (duplicate username) surfaces as an inline `<Alert severity="error">` inside the dialog; dialog stays open so the user can retry with a different username.
   - On success, the dialog closes and the table refetches/updates optimistically.
3. Each row has a "Delete" icon button that opens an MUI confirmation `Dialog` ("Delete user <username>? This cannot be undone.") before calling `DELETE /api/admin/users/{id}`.
   - `409` (has calculation history) or `400` (deleting self) surface as a `<Snackbar>`/`<Alert>` with the server's error message; the row is not removed from the table.
   - On success (`204`), the row is removed from the table.
4. The current admin's own row shows the Delete button **disabled** (not just erroring after the click) with a tooltip "You cannot delete your own account" — a UX nicety on top of the server-side check from 10.3.
5. Loading and empty states are handled (`CircularProgress` while fetching; "No users found" if the list is somehow empty).

## Tasks / Subtasks

- [ ] **Task 1 — Page shell + fetch** (AC: 1, 5)
  - [ ] `AdminUsers.jsx` fetches `GET /api/admin/users` via `apiClient` on mount.
- [ ] **Task 2 — Create dialog** (AC: 2)
  - [ ] Form state + validation + `POST` call + error handling per Dev Notes.
- [ ] **Task 3 — Delete confirmation + self-delete guard** (AC: 3, 4)
  - [ ] Confirmation dialog + `DELETE` call + error handling.
  - [ ] Disable Delete button when `row.id === currentUserId` (derive current user's id — either decode from JWT alongside `role` in Story 10.5, or match by `user` username against the fetched list).
- [ ] **Task 4 — Wire into the route** (AC: 1)
  - [ ] Replace the `/admin/users` placeholder from Story 10.5 with `<AdminUsers />`.
- [ ] **Task 5 — Manual verification** (AC: all)
  - [ ] As `admin`: page loads with `evi`, `nik`, `admin` listed.
  - [ ] Create `temp`/`temp123`/`User` → appears in the table.
  - [ ] Create `temp` again → inline duplicate-username error, dialog stays open.
  - [ ] Delete `temp` → row disappears.
  - [ ] Attempt to delete a user with existing calculation history → error surfaced, row stays.
  - [ ] Own row's Delete button is disabled with tooltip.
- [ ] **Task 6 — Open the PR**
  - [ ] Branch: `feature/10.6-admin-users-page`

## Dev Notes

Follow the same fetch/loading/error conventions already established in `pages/History.jsx` (Story 6.4) for consistency — reuse `apiClient`, the same `CircularProgress`/`Alert` patterns, no new state-management library (PRD §11 C6).

### `AdminUsers.jsx` — full component

`src/pages/AdminUsers.jsx`:

```jsx
import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Container, Stack,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer,
  IconButton, Tooltip, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function AdminUsers() {
  const { user, logout } = useAuth();

  // Table state
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Create dialog state
  const [createOpen,  setCreateOpen]  = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole,     setNewRole]     = useState('User');
  const [creating,    setCreating]    = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, username }
  const [deleting,     setDeleting]     = useState(false);

  // Snackbar for delete errors
  const [snackbar, setSnackbar] = useState('');

  const refetch = () =>
    apiClient.get('/api/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => setError('Could not load users.'));

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Create ---
  const isCreateValid = newUsername.trim().length > 0 && newPassword.length >= 4;

  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/api/admin/users', {
        username: newUsername.trim(),
        password: newPassword,
        role:     newRole,
      });
      setCreateOpen(false);
      setNewUsername(''); setNewPassword(''); setNewRole('User');
      refetch();
    } catch (err) {
      if (err.response?.status === 409) {
        setCreateError(`Username "${newUsername.trim()}" is already taken.`);
      } else {
        setCreateError('Could not create user. Try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteTarget(null);
      const msg = err.response?.data?.error ?? 'Could not delete user.';
      setSnackbar(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Admin — Users</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <Button color="inherit" component={Link} to="/admin/history">History</Button>
          <Button color="inherit" onClick={logout}>Logout ({user})</Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>Add user</Button>
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No users found.</TableCell>
                </TableRow>
              )}
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{fmtDate(u.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={u.username === user ? 'You cannot delete your own account' : 'Delete'}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={u.username === user}
                          onClick={() => setDeleteTarget({ id: u.id, username: u.username })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" value={newUsername}
              onChange={e => setNewUsername(e.target.value)} autoFocus fullWidth />
            <TextField label="Password" type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} fullWidth
              helperText="Minimum 4 characters" />
            <TextField label="Role" select value={newRole}
              onChange={e => setNewRole(e.target.value)} fullWidth>
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); setCreateError(''); }}>Cancel</Button>
          <Button variant="contained" disabled={!isCreateValid || creating} onClick={handleCreate}>
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.username}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={deleting} onClick={handleDelete}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error snackbar */}
      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar('')}
        message={snackbar} />
    </>
  );
}
```

### Self-delete guard: matching by username vs. id

The component compares `u.username === user` (the logged-in username from `AuthContext`) rather than by id, because `useAuth()` exposes `user` as a username string (not a numeric id) and the `/api/admin/users` response includes `username`. This is safe — usernames are unique (`Users.Username UNIQUE` from Story 4.3). If a numeric id comparison is preferred, decode it from the JWT in Story 10.5's `AuthContext` changes (the JWT `uid` claim exists), then compare `u.id === currentUserId`.

### Client-side validation is defence-in-depth, not the source of truth

`isCreateValid` disables the submit button early, but the server validates independently. A `400` from the server should still be handled gracefully (current code maps unknown errors to "Could not create user. Try again.") even if it should be unreachable in normal use.

### Out of scope

- `AdminHistory.jsx` — Story 10.7.
- Automated tests — Story 10.8.
- Editing an existing user's role/password — not requested (create/delete only, per FR7).

### Project Structure Notes

- **NEW:** `src/pages/AdminUsers.jsx`
- **MODIFY:** router config — replace the `/admin/users` placeholder from Story 10.5

### References

- [Source: PRD §5 FR7; §11 C6](../planning-artifacts/prd.md)
- [Source: epics.md Story 10.6](../planning-artifacts/epics.md)
- [Source: Story 10.3 — `/api/admin/users` API this consumes](./10-3-admin-users-crud.md)
- [Source: Story 10.5 — route/guard this plugs into](./10-5-admin-route-guard-nav.md)
- [Source: Story 6.4 — History fetch/loading/error conventions reused here](./6-4-wire-history-api.md)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
