import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { getDashboardSummary } from '../services/dashboardService';

jest.mock('../services/dashboardService', () => ({
  getDashboardSummary: jest.fn(),
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the three most recent available equipments', async () => {
    getDashboardSummary.mockResolvedValue({
      data: {
        clients: 0,
        equipments: 0,
        technicians: 0,
        interventions: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        recentInterventions: [],
        recentClients: [],
        availableEquipments: [
          { id: 1, name: 'Scanner A', createdAt: '2024-01-01T00:00:00Z' },
          { id: 2, name: 'Scanner B', createdAt: '2024-01-02T00:00:00Z' },
          { id: 3, name: 'Scanner C', createdAt: '2024-01-03T00:00:00Z' },
          { id: 4, name: 'Scanner D', createdAt: '2024-01-04T00:00:00Z' },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Équipements disponibles/i)).toBeTruthy();
    });

    expect(screen.getByText('Scanner A')).toBeTruthy();
    expect(screen.getByText('Scanner B')).toBeTruthy();
    expect(screen.getByText('Scanner C')).toBeTruthy();
    expect(screen.queryByText('Scanner D')).toBeNull();
  });
});
