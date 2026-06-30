// Helper dùng chung: kiểm tra đăng nhập trước khi thực hiện hành động cần tài khoản
// (thêm giỏ hàng, yêu thích...). Nếu chưa đăng nhập, phát sự kiện để LoginPromptModal hiển thị.

export const REQUEST_LOGIN_EVENT = 'request-login';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('smarthub_token');
}

export function requireLogin(message?: string): boolean {
  if (isLoggedIn()) return true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REQUEST_LOGIN_EVENT, { detail: { message } }));
  }
  return false;
}
