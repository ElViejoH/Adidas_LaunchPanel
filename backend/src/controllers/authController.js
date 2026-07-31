import { login as loginUser } from '../services/authService.js'

export async function login(req, res) {
  const data = await loginUser(req.body)
  res.status(200).json({ data })
}

export function getCurrentUser(req, res) {
  res.status(200).json({ data: req.user })
}
