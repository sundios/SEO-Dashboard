# Data Persistence Feature

## Overview

The GSC Dashboard now includes intelligent data caching and persistence across sections. This means that when you fetch data in one section (Dashboard, Overall Overview, or Performance), the data is stored in a shared context and remains available when you navigate to other sections.

## How It Works

### Shared Context (`DataContext`)
- All sections now use a centralized `DataContext` that stores:
  - Site list and selected site
  - Date ranges (start/end dates)
  - Device filtering settings
  - Performance data cache
  - Overview data cache
  - Loading states and error handling

### Smart Caching Logic
Data is cached and reused when:
- Same site is selected
- Same date range is used
- Same dimensions are requested
- Same device filter is applied

### Cache Invalidation
Data is refreshed when:
- Different parameters are selected
- "Refresh Data" button is clicked
- Settings change that affect the query

## User Experience Improvements

### 📊 Dashboard Page
- **Persistent Settings**: Site selection, date ranges, and device filters persist across navigation
- **Cached Data**: Performance data is cached and instantly available when returning to the page
- **Refresh Button**: Manual refresh option in the header
- **Cache Indicator**: Shows when cached data is being displayed
- **Device Selection**: Added device filtering to controls

### 📈 Overall Overview Page
- **Multi-Site Caching**: Stores data for all top sites in the overview
- **Smart Refresh**: Only refetches data when settings change or manual refresh is triggered
- **Persistent Controls**: Time period, device, and secondary metric selections are remembered
- **Cache Status**: Visual indicator showing cached data status

### 🔬 Performance Page
- **Correlation Matrix Cache**: Heavy correlation analysis data is cached for instant reuse
- **Parameter Persistence**: Site, date range, and device settings are shared
- **Quick Navigation**: Switch between sections without losing analytical context

## Visual Indicators

### Cache Status Indicators
- **💾 Data cached** - Shows when displaying cached results
- **🔄 Refresh Data** - Manual refresh button in each section header
- **Loading states** - Consistent loading indicators across all sections

### Smart Loading
- **Instant Display**: Cached data appears immediately
- **Background Updates**: Data refreshes only when needed
- **Error Persistence**: Error states are preserved and cleared appropriately

## Technical Implementation

### Context Structure
```typescript
interface DataContextType {
  // Sites management
  sites: string[];
  
  // Performance data caching
  performanceData: PerformanceData | null;
  
  // Overview data caching
  overviewData: SiteOverviewData[];
  
  // Shared settings
  selectedSite: string;
  startDate: string;
  endDate: string;
  device: string;
  
  // Loading states
  performanceLoading: boolean;
  overviewLoading: boolean;
  
  // Error handling
  error: string;
}
```

### Cache Key Strategy
Data is cached using composite keys based on:
- `site` + `startDate` + `endDate` + `dimensions` + `device`

### Memory Management
- Cached data is stored in React state (memory)
- No localStorage persistence (fresh on page reload)
- Automatic cleanup when navigating away from the app

## Benefits

1. **Faster Navigation**: Switch between sections instantly without re-fetching
2. **Better UX**: Maintain context and settings across the entire dashboard
3. **Reduced API Calls**: Avoid unnecessary backend requests
4. **Consistent State**: Shared settings ensure coherent experience
5. **Performance**: Large datasets (correlation matrices, overview charts) load once

## Usage Guidelines

### For Best Performance
1. **Fetch Once**: Load data in one section, then navigate freely
2. **Use Refresh**: Click refresh buttons when you want fresh data
3. **Check Indicators**: Look for cache status indicators to understand data state
4. **Parameter Changes**: Changing parameters will trigger fresh data fetches

### Navigation Flow
```
Dashboard (fetch data) → Overview (uses cache) → Performance (uses cache)
     ↓                        ↓                         ↓
 Fresh data              Instant display          Instant display
```

## Future Enhancements

- **LocalStorage Persistence**: Cache data across browser sessions
- **Selective Cache Clearing**: Clear specific data types
- **Cache Expiration**: Automatic refresh after time periods
- **Offline Support**: Work with cached data when backend is unavailable 