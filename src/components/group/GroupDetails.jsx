import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useSelector } from 'react-redux'

import { groupService } from '../../services/group.service.local'
import { loadGroup, removeExpenseFromGroup } from '../../store/actions/group.actions'

import { EmptyExpenses } from '../general/EmptyExpenses'
import { MainLoader } from '../general/MainLoader'
import { ExpenseList } from '../expense/ExpenseList'
import { EditExpenseModal } from '../modals/EditExpenseModal'
import { GeneralHeader } from '../general/GeneralHeader'

export function GroupDetails() {
  const [expenseToEdit, setExpenseToEdit] = useState(null)
  const group = useSelector(store => store.groupModule.currentGroup)
  const { groupId } = useParams()

  useEffect(() => {
    loadGroup(groupId)
  }, [groupId])

  // todo - show user msg
  async function onRemoveExpense(expenseId) {
    try {
      await removeExpenseFromGroup(group, expenseId)
    } catch (err) {
      console.log('Had issues with removing expense:', err)
    }
  }

  if (!group) return

  const { expenses, title, imgUrl } = group
  return (
    <section className="group-details">
      <GeneralHeader title={title} imgUrl={imgUrl} />

      {expenses.length ? (
        <ExpenseList
          expenses={expenses}
          onRemoveExpense={onRemoveExpense}
          setExpenseToEdit={setExpenseToEdit}
        />
      ) : (
        <EmptyExpenses />
      )}

      {expenseToEdit && (
        <EditExpenseModal
          onCloseModal={() => setExpenseToEdit(null)}
          group={group}
          currentExpense={expenseToEdit}
        />
      )}
    </section>
  )
}
