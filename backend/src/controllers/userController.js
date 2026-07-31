import { listUsers, updateUserRole as updateUserRoleRecord } from '../services/userService.js'

export async function getUsers(req, res) {
  const users = await listUsers(req.query, req.user)
  res.status(200).json({ data: users })
}

export async function updateUserRole(req, res) {
  const user = await updateUserRoleRecord(req.params.id, req.body, req.user)
  res.status(200).json({
    data: user,
    message: 'Permisos actualizados correctamente.',
  })
}
