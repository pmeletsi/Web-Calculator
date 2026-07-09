import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, TextField, Stack,
  TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Paper,
} from '@mui/material';
import { useAuth } from '../lib/AuthContext.jsx';

const History = ({ history, clearHistory }) => {
  const { logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = !debouncedSearch
    ? history
    : history.filter((h) => (h.username || '').toLowerCase().includes(debouncedSearch));

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const fmtDate = (iso) => new Date(iso).toLocaleString();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Web Calculator - History</Typography>
          <Button color="inherit" component={Link} to="/">Calculator</Button>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
          <TextField
            label="Search by username"
            size="small"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            sx={{ flexGrow: 1 }}
          />
          <Button color="warning" variant="outlined" onClick={clearHistory}>Clear</Button>
        </Stack>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Expression</TableCell>
                <TableCell align="right">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No calculations to show.</TableCell>
                </TableRow>
              ) : paged.map((h) => (
                <TableRow key={`${h.createdAt}-${h.id ?? h.expression}`}>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell>{h.username || '\u2014'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{h.expression}</TableCell>
                  <TableCell align="right">{h.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </TableContainer>
      </Container>
    </>
  );
};

export default History;
