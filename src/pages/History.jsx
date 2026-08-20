import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, TextField, Stack, Alert, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Paper, Skeleton, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../lib/apiClient';
import { useAuth } from '../lib/AuthContext.jsx';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';

const fmtDate = (iso) => new Date(iso).toLocaleString();

const History = () => {
  const { logout, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      const params = { page: page + 1, pageSize: rowsPerPage };
      if (debouncedSearch) params.username = debouncedSearch;

      try {
        const { data } = await apiClient.get('/api/calculations', { params });
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return;
        setError('Could not load history.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();

    return () => { cancelled = true; };
  }, [page, rowsPerPage, debouncedSearch, refreshKey]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);

    try {
      await apiClient.delete(`/api/calculations/${id}`);

      if (items.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError('Could not delete calculation.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setError(null);

    try {
      await apiClient.delete('/api/calculations');
      setPage(0);
      setSearchInput('');
      setDebouncedSearch('');
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      if (err.response?.status !== 401) {
        setError('Could not clear history.');
      }
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Web Calculator - History</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <ThemeToggleButton />
          <Button color="inherit" onClick={logout}>Logout</Button>
                  {isAdmin && (
                      <>
                          <Button color="inherit" component={Link} to="/admin/users">
                              Admin Users
                          </Button>

                          <Button color="inherit" component={Link} to="/admin/history">
                              Admin History
                          </Button>
                      </>
                  )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField label="Search by username" size="small" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} sx={{ flexGrow: 1 }} />
          <Button color="warning" variant="outlined" onClick={handleClear} disabled={clearing || loading}>
            Clear
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Expression</TableCell>
                <TableCell align="right">Result</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={'skeleton-' + i}>
                    <TableCell colSpan={5}><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No calculations to show.</TableCell>
                </TableRow>
              ) : items.map((h) => (
                <TableRow key={`${h.createdAt}-${h.id ?? h.expression}`}>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell>{h.username}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{h.expression}</TableCell>
                  <TableCell align="right">{h.result}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete">
                      <span>
                        <IconButton
                          color="error"
                          aria-label="Delete calculation"
                          disabled={deletingId === h.id}
                          onClick={() => handleDelete(h.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
        </TableContainer>
      </Container>
    </>
  );
};

export default History;
