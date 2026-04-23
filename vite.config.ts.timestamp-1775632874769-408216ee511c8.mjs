// vite.config.ts
import { defineConfig } from "file:///C:/Users/ASHIQUE/Desktop/Acculead/saas/Hotel_Department_effiency_analizer/production/Hotel_Department_effiency_analizer_Frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ASHIQUE/Desktop/Acculead/saas/Hotel_Department_effiency_analizer/production/Hotel_Department_effiency_analizer_Frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/ASHIQUE/Desktop/Acculead/saas/Hotel_Department_effiency_analizer/production/Hotel_Department_effiency_analizer_Frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cached long-term
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Charting library — largest dependency
          "vendor-charts": ["recharts"],
          // HTML-to-canvas for report exports
          "vendor-html2canvas": ["html2canvas"],
          // Icon library
          "vendor-icons": ["lucide-react"],
          // State + HTTP layer
          "vendor-data": ["zustand", "axios", "react-hot-toast"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBU0hJUVVFXFxcXERlc2t0b3BcXFxcQWNjdWxlYWRcXFxcc2Fhc1xcXFxIb3RlbF9EZXBhcnRtZW50X2VmZmllbmN5X2FuYWxpemVyXFxcXHByb2R1Y3Rpb25cXFxcSG90ZWxfRGVwYXJ0bWVudF9lZmZpZW5jeV9hbmFsaXplcl9Gcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQVNISVFVRVxcXFxEZXNrdG9wXFxcXEFjY3VsZWFkXFxcXHNhYXNcXFxcSG90ZWxfRGVwYXJ0bWVudF9lZmZpZW5jeV9hbmFsaXplclxcXFxwcm9kdWN0aW9uXFxcXEhvdGVsX0RlcGFydG1lbnRfZWZmaWVuY3lfYW5hbGl6ZXJfRnJvbnRlbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FTSElRVUUvRGVza3RvcC9BY2N1bGVhZC9zYWFzL0hvdGVsX0RlcGFydG1lbnRfZWZmaWVuY3lfYW5hbGl6ZXIvcHJvZHVjdGlvbi9Ib3RlbF9EZXBhcnRtZW50X2VmZmllbmN5X2FuYWxpemVyX0Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcblxyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gIGJ1aWxkOiB7XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgLy8gUmVhY3QgY29yZSBcdTIwMTQgcmFyZWx5IGNoYW5nZXMsIGNhY2hlZCBsb25nLXRlcm1cclxuICAgICAgICAgICd2ZW5kb3ItcmVhY3QnOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAvLyBDaGFydGluZyBsaWJyYXJ5IFx1MjAxNCBsYXJnZXN0IGRlcGVuZGVuY3lcclxuICAgICAgICAgICd2ZW5kb3ItY2hhcnRzJzogWydyZWNoYXJ0cyddLFxyXG4gICAgICAgICAgLy8gSFRNTC10by1jYW52YXMgZm9yIHJlcG9ydCBleHBvcnRzXHJcbiAgICAgICAgICAndmVuZG9yLWh0bWwyY2FudmFzJzogWydodG1sMmNhbnZhcyddLFxyXG4gICAgICAgICAgLy8gSWNvbiBsaWJyYXJ5XHJcbiAgICAgICAgICAndmVuZG9yLWljb25zJzogWydsdWNpZGUtcmVhY3QnXSxcclxuICAgICAgICAgIC8vIFN0YXRlICsgSFRUUCBsYXllclxyXG4gICAgICAgICAgJ3ZlbmRvci1kYXRhJzogWyd6dXN0YW5kJywgJ2F4aW9zJywgJ3JlYWN0LWhvdC10b2FzdCddLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb2tCLFNBQVMsb0JBQW9CO0FBQ2ptQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFJeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQTtBQUFBLFVBRXpELGlCQUFpQixDQUFDLFVBQVU7QUFBQTtBQUFBLFVBRTVCLHNCQUFzQixDQUFDLGFBQWE7QUFBQTtBQUFBLFVBRXBDLGdCQUFnQixDQUFDLGNBQWM7QUFBQTtBQUFBLFVBRS9CLGVBQWUsQ0FBQyxXQUFXLFNBQVMsaUJBQWlCO0FBQUEsUUFDdkQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
