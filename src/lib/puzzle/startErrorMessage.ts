/** Map API / network errors to player-friendly Vietnamese. */
export function mapStartErrorMessage(raw: string | undefined, status?: number): string {
  if (!raw) {
    if (status === 401) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
    if (status === 503) return 'Hệ thống đang cập nhật. Thử lại sau vài phút.';
    return 'Không thể bắt đầu. Thử lại sau.';
  }
  const lower = raw.toLowerCase();
  if (lower.includes('schema outdated') || lower.includes('migrate')) {
    return 'Hệ thống đang cập nhật cơ sở dữ liệu. Liên hệ quản trị nếu lỗi kéo dài.';
  }
  if (lower.includes('phiên') || lower.includes('session') || lower.includes('unauthorized')) {
    return 'Phiên đăng nhập không hợp lệ. Hãy đăng xuất và đăng nhập lại.';
  }
  if (lower.includes('no puzzle')) {
    return 'Chưa có puzzle cho ngày này.';
  }
  return raw;
}
