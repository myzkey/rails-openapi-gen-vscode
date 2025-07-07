import { HoverProvider, Hover, TextDocument, Position } from '~/application/port/hover-port'
import { HoverUseCase } from '~/application/hover-use-case'

/**
 * Hover provider for @openapi comments
 */
export class OpenApiHoverProvider implements HoverProvider {
  private hoverUseCase = new HoverUseCase()

  provideHover(document: TextDocument, position: Position): Hover | undefined {
    return this.hoverUseCase.getHover(document, position)
  }
}
