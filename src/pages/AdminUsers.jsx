import { useEffect, useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Stack,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    TableContainer,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function AdminUsers() {
    const { user, logout } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('User');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [snackbar, setSnackbar] = useState('');

    const refetch = () =>
        apiClient
            .get('/api/admin/users')
            .then((r) => setUsers(r.data))
            .catch(() => setError('Could not load users.'));

    useEffect(() => {
        refetch().finally(() => setLoading(false));
    }, []);

    const isCreateValid =
        newUsername.trim().length > 0 &&
        newPassword.length >= 4;

    const handleCreate = async () => {
        setCreating(true);
        setCreateError('');

        try {
            await apiClient.post('/api/admin/users', {
                username: newUsername.trim(),
                password: newPassword,
                role: newRole,
            });

            setCreateOpen(false);
            setNewUsername('');
            setNewPassword('');
            setNewRole('User');

            refetch();
        } catch (err) {
            if (err.response?.status === 409) {
                setCreateError(
                    `Username "${newUsername.trim()}" is already taken.`
                );
            } else {
                setCreateError('Could not create user. Try again.');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            await apiClient.delete(
                `/api/admin/users/${deleteTarget.id}`
            );

            setDeleteTarget(null);
            refetch();
        } catch (err) {
            setDeleteTarget(null);

            const msg =
                err.response?.data?.error ??
                'Could not delete user.';

            setSnackbar(msg);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <CircularProgress sx={{ m: 4 }} />;
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        sx={{ flexGrow: 1 }}
                    >
                        Admin - Users
                    </Typography>

                    <Button
                        color="inherit"
                        component={Link}
                        to="/"
                    >
                        Calculator
                    </Button>

                    <Button
                        color="inherit"
                        component={Link}
                        to="/admin/history"
                    >
                        History
                    </Button>

                    <Button
                        color="inherit"
                        onClick={logout}
                    >
                        Logout ({user})
                    </Button>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 4 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mb: 2 }}
                >
                    <Button
                        variant="contained"
                        onClick={() => setCreateOpen(true)}
                    >
                        Add user
                    </Button>
                </Stack>

                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell align="right">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        align="center"
                                    >
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}

                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.username}</TableCell>
                                    <TableCell>{u.role}</TableCell>
                                    <TableCell>
                                        {fmtDate(u.createdAt)}
                                    </TableCell>

                                    <TableCell align="right">
                                        <Tooltip
                                            title={
                                                u.username === user
                                                    ? 'You cannot delete your own account'
                                                    : 'Delete'
                                            }
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    disabled={u.username === user}
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: u.id,
                                                            username: u.username,
                                                        })
                                                    }
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

            <Dialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Add user</DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Username"
                            value={newUsername}
                            onChange={(e) =>
                                setNewUsername(e.target.value)
                            }
                            autoFocus
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            fullWidth
                            helperText="Minimum 4 characters"
                        />

                        <TextField
                            label="Role"
                            select
                            value={newRole}
                            onChange={(e) =>
                                setNewRole(e.target.value)
                            }
                            fullWidth
                        >
                            <MenuItem value="User">
                                User
                            </MenuItem>

                            <MenuItem value="Admin">
                                Admin
                            </MenuItem>
                        </TextField>

                        {createError && (
                            <Alert severity="error">
                                {createError}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => {
                            setCreateOpen(false);
                            setCreateError('');
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        disabled={
                            !isCreateValid || creating
                        }
                        onClick={handleCreate}
                    >
                        {creating ? (
                            <CircularProgress
                                size={20}
                                color="inherit"
                            />
                        ) : (
                            'Create'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
            >
                <DialogTitle>
                    Delete user
                </DialogTitle>

                <DialogContent>
                    <Typography>
                        Delete{' '}
                        <strong>
                            {deleteTarget?.username}
                        </strong>
                        ? This cannot be undone.
                    </Typography>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() =>
                            setDeleteTarget(null)
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleting}
                        onClick={handleDelete}
                    >
                        {deleting ? (
                            <CircularProgress
                                size={20}
                                color="inherit"
                            />
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbar}
                autoHideDuration={5000}
                onClose={() => setSnackbar('')}
                message={snackbar}
            />
        </>
    );
}