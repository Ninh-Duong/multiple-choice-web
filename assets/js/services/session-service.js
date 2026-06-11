export function isLoggedIn() { return sessionStorage.getItem('isLoggedIn') === 'true'; }
export function currentUser() { return sessionStorage.getItem('currentUser') || ''; }
export function loginUser(username) { sessionStorage.setItem('isLoggedIn', 'true'); sessionStorage.setItem('currentUser', username); }
export function logoutUser() { sessionStorage.removeItem('isLoggedIn'); sessionStorage.removeItem('currentUser'); }

export function isAdminLoggedIn() { return sessionStorage.getItem('adminAuth') === 'true'; }
export function currentAdmin() { return sessionStorage.getItem('adminUser') || ''; }
export function loginAdmin(username) { sessionStorage.setItem('adminAuth', 'true'); sessionStorage.setItem('adminUser', username); }
export function logoutAdmin() { sessionStorage.removeItem('adminAuth'); sessionStorage.removeItem('adminUser'); }
