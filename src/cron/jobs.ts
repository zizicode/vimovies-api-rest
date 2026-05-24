import cron from 'node-cron'

export const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Cron ejecutándose cada minuto')
  })
}