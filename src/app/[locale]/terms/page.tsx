import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '服务条款 - MIC.BEST',
  description: 'MIC.BEST 服务条款',
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[var(--c-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">服务条款</h1>
          <p className="text-sm text-[var(--c-g500)]">最后更新：2026年4月6日</p>
        </div>

        <div className="space-y-8 text-sm text-[var(--c-g400)] leading-relaxed">

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">1. 服务条款的接受</h2>
            <p>
              欢迎使用 MIC.BEST（以下简称"我们"或"MIC.BEST"）。在使用我们的服务之前，请您仔细阅读本服务条款（以下简称"条款"）。访问或使用 MIC.BEST 网站、产品和服务，即表示您已阅读、理解并同意接受本条款的约束。如果您不同意本条款的任何内容，请勿使用我们的服务。
            </p>
          </section>

          {/* 2. Service Description */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">2. 服务描述</h2>
            <p className="mb-3">
              MIC.BEST 是一个人工智能驱动的硬件原型设计平台，提供以下服务：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>通过自然语言对话生成硬件物料清单（BOM）</li>
              <li>自动生成接线图和装配说明</li>
              <li>基于中国供应链（LCSC、JLCPCB、嘉立创）的元件价格参考</li>
              <li>AI 辅助零件选型和推荐</li>
              <li>社区项目分享和浏览</li>
            </ul>
            <p className="mt-3">
              我们保留随时修改、暂停或终止任何服务的权利，并尽可能提前通知用户。
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">3. 用户账户</h2>
            <p className="mb-3">注册账户时，您同意：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>提供真实、准确、完整的个人信息</li>
              <li>妥善保管账户凭证，如用户名和密码</li>
              <li>对账户下的所有活动承担全部责任</li>
              <li>立即通知我们任何未经授权的账户使用行为</li>
            </ul>
            <p className="mt-3">
              我们有权出于任何原因（包括但不限于虚假信息、违规使用）在不通知的情况下暂停或终止您的账户。
            </p>
          </section>

          {/* 4. Subscription & Payment */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">4. 订阅与支付</h2>
            <p className="mb-3">
              MIC.BEST 提供免费版和专业版（Pro）两种计划：
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>免费版</strong>：有限的 BOM 生成次数和功能访问权限</li>
              <li><strong>专业版</strong>：无限 BOM 生成、优先体验新功能、专属技术支持</li>
            </ul>
            <p className="mb-3">
              订阅费用按月或按年收取，以您选择的方式计费。价格已在订阅时明确告知。专业版订阅会自动续期，直至您在当前计费周期结束前取消。
            </p>
            <p className="mb-3">
              <strong>退款政策</strong>：由于我们的服务为数字产品，一旦开始使用（非试用期），不支持退款。如遇技术故障导致服务不可用，请在 7 天内联系我们协商处理。
            </p>
            <p>
              我们保留因任何原因调整价格的权利，价格调整将在下一个计费周期生效。我们会提前至少 30 天通过电子邮件通知即将到来的价格变更。
            </p>
          </section>

          {/* 5. AI-Generated Content */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">5. AI 生成内容的免责声明</h2>
            <p className="mb-3">
              MIC.BEST 使用人工智能技术生成 BOM、接线图、装配步骤等硬件设计内容。
            </p>
            <p className="mb-3">
              <strong>重要提示</strong>：AI 生成的内容仅供参考，不能替代专业工程判断。在实际采购、装配或使用任何 AI 推荐的元件之前，您有责任：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>独立验证元件规格、兼容性和可用性</li>
              <li>核实供应商信息、价格和库存状态</li>
              <li>咨询专业工程师确保设计安全可靠</li>
              <li>遵守您所在国家/地区的相关法规和安全标准</li>
            </ul>
            <p className="mt-3">
              对于因使用 AI 生成内容（包括但不限于 BOM 数据、接线图、装配说明）而导致的任何财产损失、人身伤害或法律责任，MIC.BEST 概不负责。
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">6. 知识产权</h2>
            <p className="mb-3">
              <strong>我们拥有的内容</strong>：MIC.BEST 的网站、设计、标识、代码、商标及服务名称归我们所有，受知识产权法律保护。未经我们明确书面许可，不得复制、修改、分发或使用。
            </p>
            <p className="mb-3">
              <strong>您的内容</strong>：您保留对您通过我们的服务创建的项目内容（包括描述、BOM 数据、图片）的所有权。您授予我们在提供服务、改善平台以及展示社区项目所需的有限许可。
            </p>
            <p>
              <strong>社区分享</strong>：将项目发布到社区，即表示您同意其他用户可以查看、复制（注明来源）您的项目内容。
            </p>
          </section>

          {/* 7. Privacy */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">7. 隐私保护</h2>
            <p className="mb-3">
              我们重视您的隐私。您的个人信息受我们的 <a href="/privacy" className="text-[var(--c-accent)] hover:underline">隐私政策</a> 约束。使用我们的服务即表示您同意我们按照隐私政策处理您的数据。
            </p>
            <p>
              我们承诺不会将您的个人数据出售给第三方广告商。
            </p>
          </section>

          {/* 8. Acceptable Use */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">8. 可接受使用</h2>
            <p className="mb-3">您同意不使用我们的服务：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>从事任何违法活动或目的</li>
              <li>生成或推广任何有害、欺诈、侵权内容</li>
              <li>尝试绕过任何安全措施或访问限制</li>
              <li>干扰或破坏我们的服务基础设施</li>
              <li>大规模自动化抓取或滥用 AI 生成接口</li>
              <li>冒充他人或传播虚假信息</li>
            </ul>
          </section>

          {/* 9. Third-Party Services */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">9. 第三方服务</h2>
            <p>
              我们的服务可能包含指向第三方供应商（LCSC、JLCPCB、嘉立创等）的链接或集成。这些第三方独立运营，其产品、服务和商业行为受其自身条款约束。我们不对第三方内容、产品或服务负责。
            </p>
          </section>

          {/* 10. Service Availability */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">10. 服务可用性</h2>
            <p>
              我们目标是保持 99.9% 的服务可用性，但不承诺服务始终不间断。由于计划内维护、紧急维护或我们无法控制的因素（包括互联网基础设施故障）可能导致服务中断。对于任何服务中断，我们不承担责任，但我们会尽快恢复正常服务。
            </p>
          </section>

          {/* 11. Limitation of Liability */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">11. 责任限制</h2>
            <p>
              在适用法律允许的最大范围内，MIC.BEST 及其关联方不对任何间接、附带、特殊、衍生性或惩罚性赔偿（包括但不限于利润损失、数据丢失、业务中断）承担责任，即使我们已被告知可能发生此类损害。
            </p>
            <p className="mt-3">
              无论任何情况下，我们对您承担的总责任均不超过您在过去 12 个月内为我们服务支付的金额。
            </p>
          </section>

          {/* 12. Indemnification */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">12. 赔偿</h2>
            <p>
              您同意赔偿并使 MIC.BEST、其关联方、管理层、董事、员工和代理免受因您违反本条款、您使用服务或您造成的任何第三方索赔而引起的任何索赔、损失、责任、损害或费用（包括合理的律师费）。
            </p>
          </section>

          {/* 13. Termination */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">13. 终止</h2>
            <p className="mb-3">
              您可以随时通过以下方式终止您的账户：
            </p>
            <p className="mb-3 pl-4 border-l-2 border-[var(--c-g800)]">
              账户设置 → 订阅管理 → 取消订阅
            </p>
            <p>
              我们可能因任何原因（包括违反本条款）终止您的账户或服务，且可能不会提前通知。在终止后，您将无法访问您的账户和数据，我们有权自行决定删除您的数据。
            </p>
          </section>

          {/* 14. Governing Law */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">14. 适用法律与争议解决</h2>
            <p>
              本条款受中华人民共和国法律管辖，并按其解释。因本条款或您使用我们的服务而产生的任何争议，双方应首先通过友好协商解决；协商不成的，提交有管辖权的人民法院诉讼解决。
            </p>
          </section>

          {/* 15. Changes to Terms */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">15. 条款变更</h2>
            <p>
              我们保留随时修改本条款的权利。重大变更将通过电子邮件或在我们网站上的显著通知告知。如果您在变更生效后继续使用服务，即表示您接受修改后的条款。
            </p>
          </section>

          {/* 16. Contact */}
          <section>
            <h2 className="text-base font-bold text-white mb-3">16. 联系我们</h2>
            <p>如对本条款有任何疑问，请联系我们：</p>
            <p className="mt-2 pl-4 border-l-2 border-[var(--c-g-accent)]">
              电子邮件：support@mic.best<br />
              网站：https://mic.best
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
