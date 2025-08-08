function adminGuard(req, res, next) {
    console.log('🔐 ADMIN_GUARD: Checking user permissions...');
    console.log('🔐 ADMIN_GUARD: User object:', req.user);
    
    if (req.user) {
        // Check both role and rolename fields for admin access
        const isAdmin = req.user.role === 'admin' || req.user.rolename === 'admin';
        
        console.log('🔐 ADMIN_GUARD: Role check:', {
            role: req.user.role,
            rolename: req.user.rolename,
            isAdmin: isAdmin
        });
        
        if (isAdmin) {
            console.log('🔐 ADMIN_GUARD: ✅ Admin access granted');
            next();
        } else {
            console.log('🔐 ADMIN_GUARD: ❌ Admin access denied - insufficient permissions');
            return res.status(403).send({ 
                error: 'User should have admin access to use this endpoint',
                userRole: req.user.role,
                userRoleName: req.user.rolename
            });
        }
    } else {
        console.log('🔐 ADMIN_GUARD: ❌ No user object found');
        return res.status(403).send({ error: 'Authentication required' });
    }
}

module.exports = {
    adminGuard,
};