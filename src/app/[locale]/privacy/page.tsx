import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策 - MIC.BEST',
  description: 'MIC.BEST 隐私政策',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-[var(--c-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">隐私政策</h1>
          <p className="text-sm text-[var(--c-g500)]">最后更新：2026年4月6日</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--c-g400)] leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-white mb-3">1. 引言</h2>
            <p>
              MIC.BEST（以下简称"我们"）承诺保护您的个人隐私。本隐私政策说明我们如何收集、使用、存储和保护您的信息。访问或使用 MIC.BEST 即表示您同意本隐私政策的条款。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">2. 我们收集的信息</h2>
            <p className="mb-3">我们收集以下类型的信息：</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>账户信息</strong>：电子邮件地址、用户名、头像（如果您选择提供）</li>
              <li><strong>使用数据</strong>：您创建的项目内容、BOM 数据、装配步骤、对话记录</li>
              <li><strong>技术数据</strong>：IP 地址、浏览器类型、操作系统、设备信息、访问时间</li>
              <li><strong>支付信息</strong>：通过 Paddle/Stripe 处理的支付信息（我们不存储您的完整信用卡信息）</li>
              <li><strong>通信数据</strong>：您与我们之间的电子邮件往来和技术支持记录</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">3. 我们如何使用您的信息</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>提供、维护和改进我们的服务</li>
              <li>处理您的订阅和支付</li>
              <li>生成 AI 内容（BOM、接线图、装配说明）</li>
              <li>向您发送账户相关通知和服务更新</li>
              <li>检测和防止欺诈及滥用</li>
              <li>遵守法律义务</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">4. AI 数据处理</h2>
            <p>
              您通过对话输入的项目描述和生成的内容将被发送到我们的 AI 服务提供商（阿里巴巴通义千问）进行处理。我们确保此类数据仅用于提供服务，不会用于训练 AI 模型或提供给任何第三方。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">5. 信息共享</h2>
            <p className="mb-3">我们不会将您的个人信息出售给广告商或数据经纪人。我们可能在以下情况下共享信息：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>服务提供商</strong>：托管、支付处理、分析等技术合作伙伴</li>
              <li><strong>法律要求</strong>：当法律或政府要求披露时</li>
              <li><strong>保护权利</strong>：当我们认为有必要保护 MIC.BEST 或他人的权利、财产或安全时</li>
              <li><strong>社区功能</strong>：如果您将项目发布到社区，您的项目名称、描述和元件清单将公开可见</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">6. 数据安全</h2>
            <p>
              我们采用行业标准的安全措施来保护您的数据，包括加密传输（SSL/TLS）、访问控制和安全存储。但是，互联网传输或电子存储无法保证 100% 安全。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">7. 数据保留</h2>
            <p>
              只要您的账户处于活跃状态或需要向您提供服务，我们就会保留您的信息。您可以随时请求删除您的账户和相关数据（但法律要求我们保留的除外）。账户删除后，数据将在 30 天内清除。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">8. 您的权利</h2>
            <p className="mb-3">根据适用法律，您有权：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>了解我们收集了关于您的哪些数据</li>
              <li>要求更正不准确的数据</li>
              <li>要求删除您的数据</li>
              <li>撤回同意（在我们依赖同意处理数据的情况下）</li>
              <li>导出您的数据</li>
              <li>反对或限制某些类型的处理</li>
            </ul>
            <p className="mt-3">行使这些权利，请联系：support@mic.best</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">9. Cookie</h2>
            <p>
              我们使用 Cookie 和类似技术来维护会话、记住您的偏好（如语言设置）和分析网站流量。您可以通过浏览器设置拒绝 Cookie，但这可能影响部分功能。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">10. 第三方链接</h2>
            <p>
              我们的服务可能包含指向 LCSC、JLCPCB、嘉立创等第三方供应商网站的链接。我们不对这些第三方的隐私实践负责，建议您查阅其各自的隐私政策。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">11. 儿童隐私</h2>
            <p>
              我们的服务不面向 13 岁以下儿童，我们不会故意收集 13 岁以下儿童的个人信息。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">12. 政策变更</h2>
            <p>
              我们可能随时更新本隐私政策。重大变更将显示在本页面顶部并更新"最后更新"日期。继续使用服务即表示您接受更新后的政策。
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white mb-3">13. 联系我们</h2>
            <p className="pl-4 border-l-2 border-[var(--c-accent)]">
              电子邮件：support@mic.best<br />
              网站：https://mic.best
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
