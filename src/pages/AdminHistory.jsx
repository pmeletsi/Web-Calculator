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
    TextField,
    TablePagination,
    Alert,
    Skeleton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext';

const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function AdminHistory() {
    const { user, logout } = useAuth();

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);

    // Το TablePagination χρησιμοποιεί page index από το 0.
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Περιμένουμε 300ms μετά την πληκτρολόγηση πριν γίνει νέο request.
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
            setPage(0);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        const params = {
            page: page + 1,
            pageSize: rowsPerPage,
        };

        // Χωρίς αναζήτηση δεν στέλνουμε καθόλου username.
        if (debouncedSearch) {
            params.username = debouncedSearch;
        }

        apiClient
            .get('/api/calculations', { params })
            .then(({ data }) => {
                if (cancelled) return;

                setRows(Array.isArray(data.items) ? data.items : []);
                setTotal(Number(data.total) || 0);
            })
            .catch((err) => {
                if (cancelled || err.response?.status === 401) return;

                setRows([]);
                setTotal(0);
                setError(
                    err.response?.data?.error ??
                    'Could not load history.'
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [page, rowsPerPage, debouncedSearch]);

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(Number(event.target.value));
        setPage(0);
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Admin - History
                    </Typography>

                    <Button color="inherit" component={Link} to="/">
                        Calculator
                    </Button>

                    <Button
                        color="inherit"
                        component={Link}
                        to="/admin/users"
                    >
                        Users
                    </Button>

                    <Button color="inherit" onClick={logout}>
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

                <Stack direction="row" sx={{ mb: 2 }}>
                    <TextField
                        label="Filter by username"
                        size="small"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                        sx={{ width: 280 }}
                    />
                </Stack>

                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Username</TableCell>
                                <TableCell>Expression</TableCell>
                                <TableCell>Result</TableCell>
                                <TableCell>Created At</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {Array.from({ length: 4 }).map(
                                            (_, cellIndex) => (
                                                <TableCell key={cellIndex}>
                                                    <Skeleton />
                                                </TableCell>
                                            )
                                        )}
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No calculations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.username}</TableCell>
                                        <TableCell>{row.expression}</TableCell>
                                        <TableCell>{row.result}</TableCell>
                                        <TableCell>
                                            {fmtDate(row.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10, 20, 50]}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
            </Container>
        </>
    );
}