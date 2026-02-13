module.exports = {
  apps : [{
    name   : "nextjs-project-1", // Tên hiển thị trong PM2 list
    script : "npm",
    args   : "start", // Chạy lệnh 'npm start'
    cwd    : "./",    // Thư mục chạy lệnh (root dự án)
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    
    // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT
    env: {
      NODE_ENV: "production",
      PORT: 4000, // Cố định cổng 4000 cho dự án này
      // Bạn có thể thêm các biến khác ở đây nếu muốn
    }
  }]
}
