import { render, screen, waitFor } from '@testing-library/react';
import ClientEquipmentsPage from './ClientEquipmentsPage';
import { getMyEquipments } from '../services/equipmentsService';

jest.mock('../services/equipmentsService', () => ({
  getMyEquipments: jest.fn()
}));

describe('ClientEquipmentsPage', () => {
  it('shows the empty-state message when the client has no equipment', async () => {
    getMyEquipments.mockResolvedValue({ data: [] });

    render(<ClientEquipmentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/You don't have any equipment/i)).toBeTruthy();
    });
  });
});
