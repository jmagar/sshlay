import React from 'react';
import {
  Card,
  CardContent,
  Skeleton,
  Box
} from '@mui/material';

export default function SkeletonLoader() {
  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={120} />
        </Box>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="60%" />
        </Box>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="80%" />
        </Box>
        <Box sx={{ mb: 1 }}>
          <Skeleton variant="text" width="40%" />
        </Box>
      </CardContent>
    </Card>
  );
}