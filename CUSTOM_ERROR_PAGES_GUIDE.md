# Custom Error Pages - 4 Messenger

## Overview

This messenger application now includes custom HTML error pages for all common HTTP error codes. These provide a professional, user-friendly experience when errors occur.

## Available Error Pages

The following custom error pages are implemented:

| Error Code | Description | Path |
|-----------|-------------|------|
| 400 | Bad Request | `/public/errors/400.html` |
| 401 | Unauthorized | `/public/errors/401.html` |
| 402 | Payment Required | `/public/errors/402.html` |
| 403 | Forbidden | `/public/errors/403.html` |
| 404 | Page Not Found | `/public/errors/404.html` |
| 405 | Method Not Allowed | `/public/errors/405.html` |
| 407 | Proxy Authentication Required | `/public/errors/407.html` |
| 408 | Request Timeout | `/public/errors/408.html` |
| 429 | Too Many Requests | `/public/errors/429.html` |
| 500 | Internal Server Error | `/public/errors/500.html` |
| 502 | Bad Gateway | `/public/errors/502.html` |
| 503 | Service Unavailable | `/public/errors/503.html` |
| 504 | Gateway Timeout | `/public/errors/504.html` |

## How It Works

### Frontend Error Handling

The frontend includes an `ErrorPage` component that displays user-friendly error pages within the React application. When an error occurs, you can trigger it using:

```typescript
import { useStore } from './store';

const { setError } = useStore();

// Trigger error display
setError(500, 'Internal Server Error', 'Something went wrong on the server');
```

**Error Page Component Location**: `src/components/ErrorPage.tsx`

- Displays error code with icon
- Shows error title and description
- Provides action buttons (Go to Home, Connect to Server, Refresh Page)
- Fully responsive and styled with Tailwind CSS

### Backend Error Handling

The Express server middleware automatically serves custom HTML error pages for browser requests and JSON responses for API requests.

**Error Handling Middleware Location**: `server/server.js` (lines ~4380+)

#### Features:

1. **Content-Type Detection**: 
   - If request accepts JSON (API calls), returns JSON response
   - If request accepts HTML (browser), returns custom HTML error page

2. **404 Handling**:
   - Unknown routes automatically return 404 error page
   - Graceful fallback to JSON if HTML page not found

3. **Error Response Format**:
   - **HTML**: Beautiful custom error page with styling and navigation options
   - **JSON**: `{ error: "Message", code: 400 }` format

## Styling

All error pages feature:

- Dark theme matching the application design (slate-900 gradient background)
- Smooth animations and transitions
- Responsive design (mobile-friendly)
- Unique color scheme for each error category:
  - **Red**: 4xx client errors (400, 403, 404, 405)
  - **Orange**: 4xx warnings (401, 402, 407, 408, 429)
  - **Red**: 5xx server errors (500, 502, 504)
  - **Orange**: Service issues (503)

- Interactive buttons with hover effects
- Emoji icons for visual recognition
- Footer with support information

## Usage Examples

### 1. Frontend Error Page

```typescript
// In a component
import { useStore } from './store';

function MyComponent() {
  const setError = useStore(s => s.setError);
  
  const handleFailedRequest = () => {
    setError(500, 'Server Error', 'Failed to process your request. Please try again later.');
  };
  
  return (
    <button onClick={handleFailedRequest}>
      Trigger Error
    </button>
  );
}
```

### 2. Backend Error Response

When an Express route encounters an error:

```javascript
// In server.js route handler
app.get('/api/example', (req, res) => {
  try {
    // Some operation that fails
    throw new Error('Something went wrong');
  } catch (err) {
    err.status = 500;
    // Middleware will handle this and return appropriate response
    throw err;
  }
});
```

### 3. Manual Status Code Response

```javascript
// Return specific status code - middleware will use custom page if available
res.status(404).json({ error: 'Not found' });
// For browsers, this will serve the 404.html page
// For APIs, this will return JSON
```

## Adding More Error Pages

To add custom pages for additional HTTP status codes:

1. Create a new HTML file in `/public/errors/`
   - Example: `/public/errors/410.html` for "Gone" (410)
   - Use the existing error pages as template

2. Update the error page map in `server/server.js`:

```javascript
const errorPageMap = {
  // ... existing entries ...
  410: '/errors/410.html',
};
```

3. The middleware will automatically serve the new error page

## Customization

### Changing Colors

Edit the CSS in any error page HTML file:

```html
<style>
  .error-code {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
    /* ... */
  }
</style>
```

### Changing Content

Edit the text in the error page HTML:

```html
<div class="error-title">Your Custom Title</div>
<div class="error-description">Your custom description</div>
```

### Adding Actions

Modify the button group in error pages:

```html
<div class="button-group">
  <button onclick="window.location.href='/about'">Learn More</button>
  <!-- ... -->
</div>
```

## Best Practices

1. **Always set appropriate status codes** when returning errors
2. **Test error pages** in both browser and API modes (curl, Postman)
3. **Keep error messages helpful** without exposing sensitive information
4. **Monitor error logs** to identify and fix underlying issues
5. **Update error pages** if you change the application design or colors

## Troubleshooting

### Error Page Not Showing

1. Verify the error page file exists in `/public/errors/`
2. Check permissions on the file
3. Ensure the status code matches an entry in `errorPageMap`
4. Check browser console for errors

### JSON Not Returning for API Calls

1. Verify the request includes proper `Accept: application/json` header
2. Check if the request is recognized as HTML request
3. Review middleware order in `server.js`

### Styling Not Applied

1. Check file paths in HTML are correct
2. Clear browser cache (Ctrl+Shift+Delete)
3. Verify CSS syntax is correct
4. Check for CSS conflicts from other stylesheets

## Related Files

- Frontend: `src/components/ErrorPage.tsx`
- Frontend Store: `src/store.ts` (setError, clearError methods)
- Backend: `server/server.js` (error middleware)
- Error Pages: `public/errors/*.html`
- Types: `src/types.ts` (ErrorPageState interface)

## Future Enhancements

Potential improvements:

- [ ] Add error tracking/logging to database
- [ ] Create error analytics dashboard
- [ ] Support internationalization (multiple languages)
- [ ] Add retry logic for transient failures
- [ ] Implement error recovery suggestions
- [ ] Create custom error codes for specific application errors
