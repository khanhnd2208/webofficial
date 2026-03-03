import { readFileSync, writeFileSync } from 'fs';

// ── Fix UsersTable.tsx ──────────────────────────────────────────
let t = readFileSync('src/app/admin/users/UsersTable.tsx', 'utf8');

t = t.replace(
  `(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
						<option key={r} value={r}>{ROLE_LABELS[r]}</option>
					))`,
  `(['student', 'admin'] as UserRole[]).map((r) => (
						<option key={r} value={r}>{r === 'admin' ? 'Admin' : 'Người dùng'}</option>
					))`
);

writeFileSync('src/app/admin/users/UsersTable.tsx', t);
console.log('UsersTable: teacher removed from dropdown =', !t.includes('ROLE_LABELS'));

// ── Fix UserDetailPanel.tsx ─────────────────────────────────────
let p = readFileSync('src/app/admin/users/UserDetailPanel.tsx', 'utf8');

// Remove teacher from role select options
p = p.replace(
  `(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
										<option key={r} value={r}>
											{r === 'admin' ? 'Admin' : r === 'teacher' ? 'Teacher' : 'Student'}
										</option>
									))`,
  `(['student', 'admin'] as UserRole[]).map((r) => (
										<option key={r} value={r}>
											{r === 'admin' ? 'Admin' : 'Người dùng'}
										</option>
									))`
);

// Null-safe registration date
p = p.replace(
  `Đăng ký {formatDistanceToNow(userSummary.createdAt)}`,
  `{userSummary.createdAt ? \`Đăng ký \${formatDistanceToNow(userSummary.createdAt)}\` : 'Người dùng cũ'}`
);

writeFileSync('src/app/admin/users/UserDetailPanel.tsx', p);
console.log('UserDetailPanel: teacher removed =', !p.includes("'teacher'"));
console.log('UserDetailPanel: null-safe date =', p.includes('userSummary.createdAt ?'));
