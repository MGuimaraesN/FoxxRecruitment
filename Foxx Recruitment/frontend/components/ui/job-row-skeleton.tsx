export function JobRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-neutral-200 rounded w-32"></div>
                <div className="h-3 bg-neutral-100 rounded w-20 mt-1"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-200 rounded w-24"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-200 rounded w-24"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-neutral-200 rounded w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-neutral-200 rounded-full w-16"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 w-5 bg-neutral-200 rounded-full ml-auto"></div></td>
        </tr>
    )
}
