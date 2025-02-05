import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
      <div className='min-h-screen bg-[#1D232A] w-full flex justify-center items-center'>
        <SignUp />
      </div>
    )
}