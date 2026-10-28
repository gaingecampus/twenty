import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { useRecordIndexFullscreen } from '@/ui/layout/fullscreen/hooks/useRecordIndexFullscreen';
import { useShowFullscreen } from '@/ui/layout/fullscreen/hooks/useShowFullscreen';

const renderFullscreen = (entry: string) =>
  renderHook(
    () => ({
      ...useRecordIndexFullscreen(),
      showFullscreen: useShowFullscreen(),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>
      ),
    },
  );

describe('record index fullscreen', () => {
  it('preserves the view, filters and pagination when entering and exiting', () => {
    const { result } = renderFullscreen(
      '/objects/pendingExpenses?viewId=current&page=3&filter=test',
    );
    act(() => result.current.toggleRecordIndexFullscreen());
    expect(result.current.isRecordIndexFullscreen).toBe(true);
    expect(result.current.showFullscreen).toBe(true);
    const query = new URLSearchParams(result.current.location.search);
    expect(query.get('viewId')).toBe('current');
    expect(query.get('page')).toBe('3');
    expect(query.get('filter')).toBe('test');
    act(() => result.current.toggleRecordIndexFullscreen());
    expect(result.current.showFullscreen).toBe(false);
    expect(result.current.location.search).toBe(
      '?viewId=current&page=3&filter=test',
    );
  });

  it('restores navigation on detail pages and unrelated routes', () => {
    const { result } = renderFullscreen('/objects/people?tableFullscreen=1');
    expect(result.current.showFullscreen).toBe(true);
    act(() =>
      result.current.navigate('/objects/people/record?tableFullscreen=1'),
    );
    expect(result.current.showFullscreen).toBe(false);
    act(() => result.current.navigate('/status-board?tableFullscreen=1'));
    expect(result.current.showFullscreen).toBe(false);
    act(() => result.current.toggleRecordIndexFullscreen());
    expect(result.current.location.pathname).toBe('/status-board');
  });
});
