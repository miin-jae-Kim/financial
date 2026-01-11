export interface IndicatorReleaseDate {
  key: string;
  name: string;
  nextReleaseDate: string | null;
  releaseName: string;
  color: string;
}

export async function getAllNextReleaseDates(): Promise<IndicatorReleaseDate[]> {
  try {
    const response = await fetch('/api/release-dates');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching release dates:', error);
    return [];
  }
}
