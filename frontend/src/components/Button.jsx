import { buttonStyles } from './buttonStyles'

export function Button({ variant, size, className, type = 'button', ...props }) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />
}
