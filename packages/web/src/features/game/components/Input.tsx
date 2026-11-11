import clsx from "clsx"
import React from "react"

type Props = React.InputHTMLAttributes<HTMLInputElement>

const Input = ({ className, type = "text", ...otherProps }: Props) => (
  <input
    type={type}
    className={clsx(
      "rounded-sm p-2 text-lg font-semibold outline-2 outline-Power-Gray",
      className,
    )}
    {...otherProps}
  />
)

export default Input
