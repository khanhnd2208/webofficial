export const AUTH_ERROR_MESSAGES: Record<string, string> = {
	CallbackRouteError:
		'Đăng nhập Google bị gián đoạn sau khi Google xác nhận. Tải lại trang — nếu bạn đã vào được, không cần đăng nhập lại.',
	OAuthCallbackError: 'Google không hoàn tất xác thực. Vui lòng thử lại.',
	OAuthAccountNotLinked:
		'Email này đã được liên kết với một tài khoản khác. Dùng đúng tài khoản Google ban đầu.',
	AccessDenied: 'Google từ chối quyền truy cập. Chọn tài khoản khác hoặc thử lại.',
	Configuration: 'Cấu hình đăng nhập đang lỗi. Không thể tiếp tục cho đến khi cấu hình được sửa.',
	OAuthSignin: 'Không kết nối được đến Google. Thử lại sau.',
	OAuthCreateAccount: 'Không tạo được tài khoản từ Google. Thử lại hoặc liên hệ quản trị.',
	SessionRequired: 'Vui lòng đăng nhập để tiếp tục.',
	Default: 'Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.',
};

export function authErrorMessage(code: string | null | undefined): string | null {
	if (!code) return null;
	return AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default;
}
