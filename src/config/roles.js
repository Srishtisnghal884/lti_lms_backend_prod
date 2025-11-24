const AccessControl = require('accesscontrol');

const ac = new AccessControl();

const roleIds = {
	ADMIN: '1',
	TEACHER: '2',
	STUDENT: '3',
};

const resources = {
	USERINFO: 'user',
	ROLE: 'role',
};

const grantsObject = {
	[roleIds.ADMIN]: {
		[resources.USERINFO]: {
			'create:any': ['*'],
			'read:any': ['*'],
			'update:any': ['*'],
			'delete:any': ['*'],
		},
		[resources.ROLE]: {
			'create:any': ['*'],
			'read:any': ['*'],
			'update:any': ['*'],
			'delete:any': ['*'],
		},
	},
	[roleIds.TEACHER]: {
		[resources.USERINFO]: {
			'create:own': ['*'],
			'read:own': ['*'],
			'update:own': ['*'],
			'delete:own': ['*'],
		},
	},
	[roleIds.STUDENT]: {
		[resources.USERINFO]: {
			'create:own': ['*'],
			'read:own': ['*'],
			'update:own': ['*'],
			'delete:own': ['*'],
		},
	},
};

const roles = (function () {
	ac.setGrants(grantsObject);
	return ac;
})();
// console.log({roles});
module.exports = {
	roles,
	resources,
};
