import React from 'react';
import { Alert, AlertTitle, Button, Container, Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    // Reset error state and try to re-render
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Render error fallback UI
      return (
        <Container maxWidth="md" style={{ marginTop: '2rem' }}>
          <Alert severity="error">
            <AlertTitle>Something went wrong</AlertTitle>
            <Typography variant="body1" gutterBottom>
              We're sorry, but something went wrong. Please try again.
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {this.state.error && this.state.error.toString()}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleRetry}
              style={{ marginTop: '1rem' }}
            >
              Try Again
            </Button>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;