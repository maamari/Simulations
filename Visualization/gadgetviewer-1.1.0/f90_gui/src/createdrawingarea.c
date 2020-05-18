#include "../../config.h"
#define DRAWINGAREASIZE_F90 FC_FUNC (drawingareasize, DRAWINGAREASIZE)
#include "../../config.h"
#define CREATEDRAWINGAREA_F90 FC_FUNC (createdrawingarea, CREATEDRAWINGAREA)
#include "../../config.h"
#define REDRAWDRAWINGAREA_F90 FC_FUNC (redrawdrawingarea, REDRAWDRAWINGAREA)
#include <stdio.h>
#include <stdlib.h>
#include <gtk/gtk.h>
#include "pack_box.h"
#include "set_event_handler.h"

static int dragging = 0;

/* Structure to store info needed by the configure event handler.
   One of these is allocated for each drawing area created. */
struct configure_info
{
  GdkPixmap **pixmap;
  int *resized;
  int *width;
  int *height;
};

/* This deallocates the structure if the drawing area is destroyed */
void da_destroy(GtkObject *object, struct configure_info *c_info)
{
  free(c_info);
}

/* This forces a redraw from the backing pixmap by causing an
   expose event. I think. */
void REDRAWDRAWINGAREA_F90(GtkWidget **drawingarea, int *width, int *height)
{
  GdkRectangle update_rect;
  update_rect.x = 0;
  update_rect.y = 0;
  update_rect.width = *width;
  update_rect.height = *height;

  gtk_widget_draw(*drawingarea, &update_rect);
    /* gtk_widget_queue_draw(*drawingarea); */

}


/* This redraws the screen from the backing pixmap when an expose event
   occurs */
static gint da_expose_event( GtkWidget      *widget, GdkEventExpose *event,
			     GdkPixmap **pixmap)
{
  gdk_draw_pixmap(widget->window,
		  widget->style->fg_gc[GTK_WIDGET_STATE (widget)],
		  *pixmap,
		  event->area.x, event->area.y,
		  event->area.x, event->area.y,
		  event->area.width, event->area.height);
  return TRUE;
}

/* This is called when the window is created or resized.
   Creates a new backing pixmap of the appropriate size */
static gint da_configure_event(GtkWidget *widget, GdkEventConfigure *event,
			struct configure_info *c_info)
{

  /* Deallocate the old pixmap first, if there was one */
  if (*(c_info->pixmap))
    gdk_pixmap_unref(*(c_info->pixmap));
  
  *(c_info->pixmap) = (gpointer) gdk_pixmap_new(widget->window,
						widget->allocation.width,
						widget->allocation.height,
						-1);
  /* Record dimensions of draw area */
  *(c_info->width)   = widget->allocation.width;
  *(c_info->height)  = widget->allocation.height;
  *(c_info->resized) = 1;

  if(event_handler != NULL) (*event_handler)();

  return FALSE;
}

/* This is called if the mouse is moved over the drawing area */
static gint da_motion_notify_event (GtkWidget *widget, GdkEventMotion *event,
				    int *mouse_state)
{
  int x, y;
  GdkModifierType mask;
  guint state;
  int b1, b2, b3, b4, b5;

  if (event->is_hint)
    {
      gdk_window_get_pointer (event->window, &x, &y, &mask);
      state = (guint) mask;
    }
  else
    {
      x = event->x;
      y = event->y;
      state = event->state;
    }

  mouse_state[0] = 1;
  mouse_state[1] = x;
  mouse_state[2] = y;

  b1 = (state & GDK_BUTTON1_MASK);
  b2 = (state & GDK_BUTTON2_MASK);
  b3 = (state & GDK_BUTTON3_MASK);
  b4 = (state & GDK_BUTTON4_MASK);
  b5 = (state & GDK_BUTTON5_MASK);

  if(b1)mouse_state[8]  = 1; else mouse_state[8]  = 0;
  if(b2)mouse_state[9]  = 1; else mouse_state[9]  = 0;
  if(b3)mouse_state[10] = 1; else mouse_state[10] = 0;
  if(b4)mouse_state[11] = 1; else mouse_state[11] = 0;
  if(b5)mouse_state[12] = 1; else mouse_state[12] = 0;

  dragging = 1;

  if(event_handler != NULL) (*event_handler)();

  return TRUE;
}

/* This is called if a button is clicked - it updates the mouse button
   state flags. */
static gint da_button_press_event (GtkWidget *widget, GdkEventButton *event,
				   int *mouse_state)
{
  /* int ibutton = event->button; */

  int b1 = (event->state & GDK_BUTTON1_MASK);
  int b2 = (event->state & GDK_BUTTON2_MASK);
  int b3 = (event->state & GDK_BUTTON3_MASK);
  int b4 = (event->state & GDK_BUTTON4_MASK);
  int b5 = (event->state & GDK_BUTTON5_MASK);

  if(b1)mouse_state[8]  = 1; else mouse_state[8]  = 0;
  if(b2)mouse_state[9]  = 1; else mouse_state[9]  = 0;
  if(b3)mouse_state[10] = 1; else mouse_state[10] = 0;
  if(b4)mouse_state[11] = 1; else mouse_state[11] = 0;
  if(b5)mouse_state[12] = 1; else mouse_state[12] = 0;

  dragging = 0;

  if(event_handler != NULL) (*event_handler)();

  return TRUE;

}


/* This is called if a button is released - it updates the mouse button
   state flags. */
static gint da_button_release_event (GtkWidget *widget, GdkEventButton *event,
				   int *mouse_state)
{
  int ibutton = event->button;

  int b1 = (event->state & GDK_BUTTON1_MASK);
  int b2 = (event->state & GDK_BUTTON2_MASK);
  int b3 = (event->state & GDK_BUTTON3_MASK);
  int b4 = (event->state & GDK_BUTTON4_MASK);
  int b5 = (event->state & GDK_BUTTON5_MASK);

  /* If the button is released, flag it as clicked as long
   as the mouse hasn't moved */
  if(ibutton <= 5 && dragging == 0)
    mouse_state[2+ibutton] = 1;

  if(b1)mouse_state[8]  = 1; else mouse_state[8]  = 0;
  if(b2)mouse_state[9]  = 1; else mouse_state[9]  = 0;
  if(b3)mouse_state[10] = 1; else mouse_state[10] = 0;
  if(b4)mouse_state[11] = 1; else mouse_state[11] = 0;
  if(b5)mouse_state[12] = 1; else mouse_state[12] = 0;

  if(event_handler != NULL) (*event_handler)();

  return TRUE;

}


/* This is called if mouse wheel is moved - it reports this as
   a click of button 4 or 5. */
static gint da_scroll_event (GtkWidget *widget, GdkEventScroll *event,
				   int *mouse_state)
{
  if(event->direction == GDK_SCROLL_UP)
    mouse_state[6] = 1;

  if(event->direction == GDK_SCROLL_DOWN)
    mouse_state[7] = 1;

  if(event_handler != NULL) (*event_handler)();

  return TRUE;

}


/* Create the drawing area widget */
void CREATEDRAWINGAREA_F90(GtkWidget **drawingarea, GtkWidget **box,
			   GdkPixmap **pixmap, int *mouse_state,
			   int *width, int *height, int *resized, int *db,
			   int *request_width, int *request_height)
{
  struct configure_info *c_info;
  *pixmap = NULL; /* so we don't try to deallocate the pixmap on the first
		     configure event */

  *drawingarea = gtk_drawing_area_new();
  pack_box(*box,*drawingarea);

  if(*request_width > 0)
    {
      gtk_widget_set_size_request(GTK_WIDGET(*drawingarea),
				  *request_width, *request_height);
    }

  gtk_widget_set_events (*drawingarea,
			   GDK_EXPOSURE_MASK
			 | GDK_DESTROY
                         | GDK_LEAVE_NOTIFY_MASK
                         | GDK_BUTTON_PRESS_MASK
                         | GDK_BUTTON_RELEASE_MASK
                         | GDK_POINTER_MOTION_MASK
                         | GDK_POINTER_MOTION_HINT_MASK
			 | GDK_SCROLL_MASK
			 | GDK_KEY_PRESS_MASK);

  c_info = malloc(sizeof(struct configure_info));
  c_info->pixmap  = pixmap;
  c_info->width   = width;
  c_info->height  = height;
  c_info->resized = resized;

  gtk_signal_connect (GTK_OBJECT (*drawingarea), "expose_event",
		      (GtkSignalFunc) da_expose_event, (gpointer) pixmap);
  gtk_signal_connect (GTK_OBJECT(*drawingarea),"configure_event",
		      (GtkSignalFunc) da_configure_event, (gpointer) c_info);
  gtk_signal_connect (GTK_OBJECT (*drawingarea), "motion_notify_event",
                      (GtkSignalFunc) da_motion_notify_event,
		      (gpointer) mouse_state);
  gtk_signal_connect (GTK_OBJECT (*drawingarea), "button_press_event",
		      (GtkSignalFunc) da_button_press_event,
		      (gpointer) mouse_state);
  gtk_signal_connect (GTK_OBJECT (*drawingarea), "button_release_event",
		      (GtkSignalFunc) da_button_release_event,
		      (gpointer) mouse_state);
  gtk_signal_connect (GTK_OBJECT (*drawingarea), "scroll_event",
		      (GtkSignalFunc) da_scroll_event,
		      (gpointer) mouse_state);
  gtk_signal_connect (GTK_OBJECT (*drawingarea), "destroy",
		      (GtkSignalFunc) da_destroy,
		      (gpointer) c_info);

  if(*db == 0)
    gtk_widget_set_double_buffered(GTK_WIDGET(*drawingarea), FALSE);
  else
    gtk_widget_set_double_buffered(GTK_WIDGET(*drawingarea), TRUE);
 
}

/* Return the size of the drawing area */
void DRAWINGAREASIZE_F90(GtkWidget **drawingarea, int *x, int *y)
{
  *x = (*drawingarea)->allocation.width;
  *y = (*drawingarea)->allocation.height;
}
